import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface CloudinaryResourcePayload {
  public_id: string;
  secure_url?: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  created_at?: string;
  asset_folder?: string;
}

export interface CloudinaryFolderPayload {
  path: string;
  name: string;
}

export interface CloudinaryFolderWithCountPayload extends CloudinaryFolderPayload {
  fileCount: number;
}

@Injectable()
export class CloudinaryAdminService {
  private readonly hasCredentials: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName') ?? process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = this.configService.get<string>('cloudinary.apiKey') ?? process.env.CLOUDINARY_API_KEY;
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret') ?? process.env.CLOUDINARY_API_SECRET;

    this.hasCredentials = Boolean(cloudName && apiKey && apiSecret);

    if (this.hasCredentials) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  async deleteAsset(publicId: string, resourceType = 'image') {
    this.ensureConfigured();

    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as 'image' | 'video' | 'raw',
      invalidate: true,
    });
  }

  async createFolder(folderPath: string): Promise<CloudinaryFolderPayload> {
    this.ensureConfigured();

    const normalizedPath = this.normalizePath(folderPath);
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
      throw new InternalServerErrorException('Failed to create Cloudinary folder');
    }
  }

  private async createSingleFolder(folderPath: string): Promise<{ path?: string; name?: string }> {
    try {
      return await cloudinary.api.create_folder(folderPath);
    } catch (error) {
      if (this.isAlreadyExistsError(error)) {
        return {
          path: folderPath,
          name: folderPath.split('/').pop() ?? folderPath,
        };
      }

      throw error;
    }
  }

  async listFolders(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    this.ensureConfigured();

    return this.listDirectFolders(parentPath);
  }

  async listFoldersRecursive(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    this.ensureConfigured();

    const normalizedParent = this.normalizePath(parentPath);
    const visited = new Set<string>();
    const queue: string[] = [];
    const collected: CloudinaryFolderPayload[] = [];

    const rootFolders = await this.listDirectFolders(normalizedParent);
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
    const normalizedParent = this.normalizePath(parentPath);
    const folders = recursive
      ? await this.listFoldersRecursive(normalizedParent)
      : await this.listDirectFolders(normalizedParent);
    const fileCounts = await Promise.all(
      folders.map(async (folder) => ({
        path: folder.path,
        count: await this.countResourcesInFolder(folder.path, true),
      })),
    );

    const countByPath = new Map(fileCounts.map((item) => [item.path, item.count]));

    return folders.map((folder) => ({
      ...folder,
      fileCount: countByPath.get(folder.path) ?? 0,
    }));
  }

  private async listDirectFolders(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    const normalizedParent = this.normalizePath(parentPath);
    const apiFolders = await this.listDirectFoldersFromApi(normalizedParent);

    if (apiFolders.length > 0) {
      return apiFolders;
    }

    // Fallback: derive folder names from resources when Cloudinary folder APIs return empty.
    const resources = await this.listResourcesForFolderDiscovery(normalizedParent);
    const folderPaths = new Set<string>();

    for (const resource of resources) {
      const derived = this.deriveFolderFromPublicId(resource.public_id, normalizedParent);
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
      const response = parentPath
        ? await cloudinary.api.sub_folders(parentPath, { max_results: 500, next_cursor: nextCursor })
        : await (cloudinary.api as unknown as {
          root_folders: (options?: { max_results?: number; next_cursor?: string }) => Promise<{
            folders?: Array<{ path?: string; name?: string }>;
            next_cursor?: string;
          }>;
        }).root_folders({ max_results: 500, next_cursor: nextCursor });

      const current = (Array.isArray(response?.folders) ? response.folders : [])
        .map((folder: { path?: string; name?: string }) => ({
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

  async listResources(folderPath?: string, includeDescendants = false): Promise<CloudinaryResourcePayload[]> {
    this.ensureConfigured();

    const normalizedFolder = this.normalizePath(folderPath);
    const [imageAssets, videoAssets, rawAssets] = normalizedFolder
      ? includeDescendants
        ? await Promise.all([
            this.listResourcesByType('image', `${normalizedFolder}/`),
            this.listResourcesByType('video', `${normalizedFolder}/`),
            this.listResourcesByType('raw', `${normalizedFolder}/`),
          ])
        : await Promise.all([
            this.listResourcesByTypeDirectInFolder('image', normalizedFolder),
            this.listResourcesByTypeDirectInFolder('video', normalizedFolder),
            this.listResourcesByTypeDirectInFolder('raw', normalizedFolder),
          ])
      : await Promise.all([
          this.listRootResourcesByType('image'),
          this.listRootResourcesByType('video'),
          this.listRootResourcesByType('raw'),
        ]);

    const byPublicId = new Map<string, CloudinaryResourcePayload>();
    for (const resource of [...imageAssets, ...videoAssets, ...rawAssets]) {
      byPublicId.set(resource.public_id, resource);
    }

    if (normalizedFolder) {
      const folderAssets = await this.listResourcesByAssetFolder(normalizedFolder);
      for (const resource of folderAssets) {
        byPublicId.set(resource.public_id, {
          ...byPublicId.get(resource.public_id),
          ...resource,
        });
      }
    }

    return [...byPublicId.values()].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getResource(publicId: string, resourceType?: string): Promise<CloudinaryResourcePayload | null> {
    this.ensureConfigured();

    const candidateTypes: CloudinaryResourceType[] = resourceType
      ? [resourceType as CloudinaryResourceType]
      : ['image', 'video', 'raw'];

    for (const type of candidateTypes) {
      try {
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: type,
          type: 'upload',
        });

        return {
          public_id: resource.public_id,
          secure_url: resource.secure_url,
          format: resource.format,
          resource_type: resource.resource_type,
          bytes: resource.bytes,
          created_at: resource.created_at,
        };
      } catch (error) {
        if (this.isNotFoundError(error)) {
          continue;
        }
        throw new InternalServerErrorException('Failed to resolve Cloudinary asset');
      }
    }

    return null;
  }

  private async listResourcesByType(resourceType: CloudinaryResourceType, prefix?: string): Promise<CloudinaryResourcePayload[]> {
    const resources: CloudinaryResourcePayload[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await cloudinary.api.resources({
        type: 'upload',
        resource_type: resourceType,
        prefix,
        max_results: 500,
        next_cursor: nextCursor,
      });

      if (Array.isArray(response?.resources)) {
        resources.push(...response.resources.map((resource: CloudinaryResourcePayload) => this.mapCloudinaryResource(resource)));
      }

      nextCursor = typeof response?.next_cursor === 'string' ? response.next_cursor : undefined;
    } while (nextCursor);

    const deduped = new Map(resources.map((resource) => [resource.public_id, resource]));
    return [...deduped.values()];
  }

  private async listRootResourcesByType(resourceType: CloudinaryResourceType): Promise<CloudinaryResourcePayload[]> {
    const resources = await this.listResourcesByType(resourceType);

    return resources.filter((resource) => !resource.public_id.includes('/'));
  }

  private async listResourcesByTypeDirectInFolder(
    resourceType: CloudinaryResourceType,
    folderPath: string,
  ): Promise<CloudinaryResourcePayload[]> {
    const prefix = `${folderPath.replace(/\/+$/, '')}/`;
    const resources = await this.listResourcesByType(resourceType, prefix);

    return resources.filter((resource) => {
      const relativePath = resource.public_id.slice(prefix.length);
      return relativePath.length > 0 && !relativePath.includes('/');
    });
  }

  private async listResourcesByAssetFolder(assetFolder: string): Promise<CloudinaryResourcePayload[]> {
    const expression = `asset_folder="${this.escapeSearchValue(assetFolder)}"`;
    const resources: CloudinaryResourcePayload[] = [];
    let nextCursor: string | undefined;

    do {
      let query = cloudinary.search.expression(expression).max_results(500);
      if (nextCursor) {
        query = (query as unknown as { next_cursor: (cursor: string) => typeof query }).next_cursor(nextCursor);
      }

      const result = await query.execute();

      if (Array.isArray(result?.resources)) {
        const matchedResources = result.resources
          .map((resource: CloudinaryResourcePayload) => this.mapCloudinaryResource(resource))
          .filter((resource) => this.normalizePath(resource.asset_folder) === assetFolder);
        resources.push(...matchedResources);
      }

      nextCursor = typeof result?.next_cursor === 'string' ? result.next_cursor : undefined;
    } while (nextCursor);

    const deduped = new Map(resources.map((resource) => [resource.public_id, resource]));
    return [...deduped.values()];
  }

  private async listResourcesForFolderDiscovery(parentPath?: string): Promise<CloudinaryResourcePayload[]> {
    const normalizedParent = this.normalizePath(parentPath);
    const prefix = normalizedParent ? `${normalizedParent.replace(/\/+$/, '')}/` : undefined;

    const [imageAssets, videoAssets, rawAssets] = await Promise.all([
      this.listResourcesByType('image', prefix),
      this.listResourcesByType('video', prefix),
      this.listResourcesByType('raw', prefix),
    ]);

    return [...imageAssets, ...videoAssets, ...rawAssets];
  }

  private isNotFoundError(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const payload = error as { http_code?: number };
    return payload.http_code === 404;
  }

  private isAlreadyExistsError(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const payload = error as { http_code?: number; message?: string };
    if (payload.http_code !== 409) {
      return false;
    }

    return typeof payload.message === 'string' && payload.message.toLowerCase().includes('already');
  }

  private deriveFolderFromPublicId(publicId: string, parentPath?: string) {
    const segments = publicId.split('/').filter(Boolean);

    if (segments.length <= 1) {
      return '';
    }

    if (!parentPath) {
      return segments[0] ?? '';
    }

    const parentSegments = parentPath.split('/').filter(Boolean);

    const isUnderParent = parentSegments.every((segment, index) => segments[index] === segment);
    if (!isUnderParent) {
      return '';
    }

    if (segments.length <= parentSegments.length + 1) {
      return '';
    }

    return [...parentSegments, segments[parentSegments.length]].join('/');
  }

  private extractFolderPathFromPublicId(publicId: string) {
    const segments = publicId.split('/').filter(Boolean);
    if (segments.length <= 1) {
      return '';
    }

    return segments.slice(0, -1).join('/');
  }

  private async countResourcesInFolder(folderPath: string, includeDescendants = false) {
    const normalizedFolderPath = this.normalizePath(folderPath);
    if (!normalizedFolderPath) {
      return 0;
    }

    const resources = await this.listResources(normalizedFolderPath, includeDescendants);

    return resources.filter((resource) => !this.isFolderMarkerResource(resource.public_id)).length;
  }

  private isFolderMarkerResource(publicId: string) {
    return publicId.endsWith('/.folder-marker') || publicId.endsWith('/.folder-marker.txt');
  }

  private normalizePath(path?: string) {
    const normalized = path?.trim().replace(/^\/+|\/+$/g, '');
    return normalized || undefined;
  }

  private escapeSearchValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private mapCloudinaryResource(resource: CloudinaryResourcePayload): CloudinaryResourcePayload {
    return {
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      format: resource.format,
      resource_type: resource.resource_type,
      bytes: resource.bytes,
      created_at: resource.created_at,
      asset_folder: resource.asset_folder,
    };
  }

  private ensureConfigured() {
    if (!this.hasCredentials) {
      throw new InternalServerErrorException('Cloudinary credentials are not configured on the server');
    }
  }
}
