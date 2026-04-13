import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_MAX_RESULTS } from '../constants/cloudinary.constants';
import {
  CloudinaryFolderListResponse,
  CloudinaryFolderPayload,
  CloudinaryFolderWithCountPayload,
} from '../types/cloudinary.types';
import {
  configureCloudinary,
  deriveFolderFromPublicId,
  hasRootFoldersApi,
  isAlreadyExistsError,
  isFolderMarkerResource,
  normalizePath,
} from '../utils/cloudinary-utils';
import { CloudinaryResourceService } from './cloudinary-resource.service';

@Injectable()
export class CloudinaryFolderService {
  private readonly logger = new Logger(CloudinaryFolderService.name);
  private readonly hasCredentials: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryResourceService: CloudinaryResourceService,
  ) {
    this.hasCredentials = configureCloudinary(this.configService);
  }

  async createFolder(folderPath: string): Promise<CloudinaryFolderPayload> {
    this.ensureConfigured();

    const normalizedPath = normalizePath(folderPath);
    if (!normalizedPath) {
      throw new BadRequestException('Folder path is required');
    }

    try {
      const pathSegments = normalizedPath.split('/').filter(Boolean);
      let currentPath = '';
      let lastResponse: { path?: string; name?: string } | null = null;

      for (const segment of pathSegments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        lastResponse = await this.createSingleFolder(currentPath);
      }

      return {
        path: lastResponse?.path ?? normalizedPath,
        name: lastResponse?.name ?? normalizedPath.split('/').pop() ?? normalizedPath,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Cloudinary folder path=${normalizedPath}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to create Cloudinary folder');
    }
  }

  async listFolders(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    this.ensureConfigured();

    try {
      return await this.listDirectFolders(parentPath);
    } catch (error) {
      this.logger.error(
        `Failed to list Cloudinary folders for parentPath=${normalizePath(parentPath) ?? '<root>'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to list Cloudinary folders');
    }
  }

  async listFoldersRecursive(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    this.ensureConfigured();

    const normalizedParent = normalizePath(parentPath);
    const visited = new Set<string>();
    const queue: string[] = [];
    const collected: CloudinaryFolderPayload[] = [];

    let rootFolders: CloudinaryFolderPayload[];
    try {
      rootFolders = await this.listDirectFolders(normalizedParent);
    } catch (error) {
      this.logger.error(
        `Failed to list Cloudinary folders recursively for parentPath=${normalizedParent ?? '<root>'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to list Cloudinary folders recursively');
    }
    for (const folder of rootFolders) {
      if (!visited.has(folder.path)) {
        visited.add(folder.path);
        queue.push(folder.path);
        collected.push(folder);
      }
    }

    while (queue.length) {
      const currentPath = queue.shift();
      if (!currentPath) {
        continue;
      }

      const children = await this.listDirectFolders(currentPath);
      for (const child of children) {
        if (visited.has(child.path)) {
          continue;
        }

        visited.add(child.path);
        queue.push(child.path);
        collected.push(child);
      }
    }

    return collected.sort((a, b) => a.path.localeCompare(b.path));
  }

  async listFoldersWithCounts(parentPath?: string, recursive = false): Promise<CloudinaryFolderWithCountPayload[]> {
    const normalizedParent = normalizePath(parentPath);
    const folders = recursive
      ? await this.listFoldersRecursive(normalizedParent)
      : await this.listFolders(normalizedParent);

    const countByPath = recursive
      ? await this.countFoldersUsingSinglePass(folders, normalizedParent)
      : await this.countFoldersByIndividualCalls(folders);

    return folders.map((folder) => ({
      ...folder,
      fileCount: countByPath.get(folder.path) ?? 0,
    }));
  }

  private async countFoldersByIndividualCalls(folders: CloudinaryFolderPayload[]): Promise<Map<string, number>> {
    const fileCounts = await Promise.all(
      folders.map(async (folder) => ({
        path: folder.path,
        count: await this.cloudinaryResourceService.countResourcesInFolder(folder.path, true),
      })),
    );

    return new Map(fileCounts.map((item) => [item.path, item.count]));
  }

  private async countFoldersUsingSinglePass(
    folders: CloudinaryFolderPayload[],
    normalizedParent?: string,
  ): Promise<Map<string, number>> {
    const allResources = await this.cloudinaryResourceService.listResources(normalizedParent, true);
    const folderPathSet = new Set(folders.map((folder) => folder.path));
    const countByPath = new Map<string, number>();

    for (const folder of folders) {
      countByPath.set(folder.path, 0);
    }

    for (const resource of allResources) {
      if (isFolderMarkerResource(resource.public_id)) {
        continue;
      }

      const segments = resource.public_id.split('/').filter(Boolean);
      if (segments.length <= 1) {
        continue;
      }

      const resourceFolders: string[] = [];
      for (let i = 1; i < segments.length; i++) {
        resourceFolders.push(segments.slice(0, i).join('/'));
      }

      for (const folderPath of resourceFolders) {
        if (!folderPathSet.has(folderPath)) {
          continue;
        }

        countByPath.set(folderPath, (countByPath.get(folderPath) ?? 0) + 1);
      }
    }

    return countByPath;
  }

  private async createSingleFolder(folderPath: string): Promise<{ path?: string; name?: string }> {
    try {
      return await cloudinary.api.create_folder(folderPath);
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        return {
          path: folderPath,
          name: folderPath.split('/').pop() ?? folderPath,
        };
      }

      throw error;
    }
  }

  private async listDirectFolders(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    const normalizedParent = normalizePath(parentPath);
    const apiFolders = await this.listDirectFoldersFromApi(normalizedParent);

    if (apiFolders.length > 0) {
      return apiFolders;
    }

    const resources = await this.cloudinaryResourceService.listResourcesForFolderDiscovery(normalizedParent);
    const folderPaths = new Set<string>();

    for (const resource of resources) {
      const derived = deriveFolderFromPublicId(resource.public_id, normalizedParent);
      if (derived) {
        folderPaths.add(derived);
      }
    }

    return [...folderPaths]
      .sort((a, b) => a.localeCompare(b))
      .map((path) => ({
        path,
        name: path.split('/').pop() || path,
      }));
  }

  private async listDirectFoldersFromApi(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    const folders: CloudinaryFolderPayload[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await this.fetchFolderPage(parentPath, nextCursor);

      const current = (Array.isArray(response?.folders) ? response.folders : [])
        .map((folder) => ({
          path: folder.path ?? folder.name ?? '',
          name: folder.name ?? folder.path ?? '',
        }))
        .filter((folder) => folder.path.length > 0);

      folders.push(...current);
      nextCursor = typeof response?.next_cursor === 'string' ? response.next_cursor : undefined;
    } while (nextCursor);

    const unique = new Map<string, CloudinaryFolderPayload>();
    for (const folder of folders) {
      unique.set(folder.path, folder);
    }

    return [...unique.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  private async fetchFolderPage(parentPath: string | undefined, nextCursor?: string): Promise<CloudinaryFolderListResponse> {
    if (parentPath) {
      return cloudinary.api.sub_folders(parentPath, {
        max_results: CLOUDINARY_MAX_RESULTS,
        next_cursor: nextCursor,
      }) as Promise<CloudinaryFolderListResponse>;
    }

    const api = cloudinary.api;

    if (!hasRootFoldersApi(api)) {
      return { folders: [], next_cursor: undefined };
    }

    return api.root_folders({
      max_results: CLOUDINARY_MAX_RESULTS,
      next_cursor: nextCursor,
    });
  }

  private ensureConfigured() {
    if (!this.hasCredentials) {
      throw new InternalServerErrorException('Cloudinary credentials are not configured on the server');
    }
  }
}
