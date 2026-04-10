import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_MAX_RESULTS, CLOUDINARY_RESOURCE_TYPES } from '../constants/cloudinary.constants';
import {
  CloudinaryResourceListResponse,
  CloudinaryResourcePayload,
  CloudinaryResourceType,
  CloudinarySearchQuery,
} from '../types/cloudinary.types';
import {
  configureCloudinary,
  escapeSearchValue,
  isFolderMarkerResource,
  isNotFoundError,
  mapCloudinaryResource,
  normalizePath,
  toResourceType,
} from '../utils/cloudinary-utils';

@Injectable()
export class CloudinaryResourceService {
  private readonly logger = new Logger(CloudinaryResourceService.name);
  private readonly hasCredentials: boolean;

  constructor(private readonly configService: ConfigService) {
    this.hasCredentials = configureCloudinary(this.configService);
  }

  async deleteAsset(publicId: string, resourceType = 'image') {
    this.ensureConfigured();

    return cloudinary.uploader.destroy(publicId, {
      resource_type: (toResourceType(resourceType) ?? 'image') as 'image' | 'video' | 'raw',
      invalidate: true,
    });
  }

  async listResources(folderPath?: string, includeDescendants = false): Promise<CloudinaryResourcePayload[]> {
    this.ensureConfigured();

    const normalizedFolder = normalizePath(folderPath);
    const assetsByType = await Promise.all(
      CLOUDINARY_RESOURCE_TYPES.map((resourceType) => this.listResourcesByFolderMode(resourceType, normalizedFolder, includeDescendants)),
    );

    const byPublicId = new Map<string, CloudinaryResourcePayload>();
    for (const resource of assetsByType.flat()) {
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

  async listResourcesForFolderDiscovery(parentPath?: string): Promise<CloudinaryResourcePayload[]> {
    const normalizedParent = normalizePath(parentPath);
    const prefix = normalizedParent ? `${normalizedParent.replace(/\/+$/, '')}/` : undefined;

    const assetsByType = await Promise.all(
      CLOUDINARY_RESOURCE_TYPES.map((resourceType) => this.listResourcesByType(resourceType, prefix)),
    );

    return assetsByType.flat();
  }


  async countResourcesInFolder(folderPath: string, includeDescendants = false): Promise<number> {
    const normalizedFolderPath = normalizePath(folderPath);
    if (!normalizedFolderPath) {
      return 0;
    }

    const resources = await this.listResources(normalizedFolderPath, includeDescendants);
    return resources.filter((resource) => !isFolderMarkerResource(resource.public_id)).length;
  }

  async getResource(publicId: string, resourceType?: string): Promise<CloudinaryResourcePayload | null> {
    this.ensureConfigured();

    const typedResource = toResourceType(resourceType);
    const candidateTypes: CloudinaryResourceType[] = typedResource
      ? [typedResource]
      : CLOUDINARY_RESOURCE_TYPES;

    for (const type of candidateTypes) {
      try {
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: type,
          type: 'upload',
        });

        return mapCloudinaryResource(resource as CloudinaryResourcePayload);
      } catch (error) {
        if (isNotFoundError(error)) {
          continue;
        }

        this.logger.error(
          `Failed to resolve Cloudinary asset for publicId=${publicId}, resourceType=${type}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException('Failed to resolve Cloudinary asset');
      }
    }

    return null;
  }

  private async listResourcesByFolderMode(
    resourceType: CloudinaryResourceType,
    normalizedFolder?: string,
    includeDescendants = false,
  ): Promise<CloudinaryResourcePayload[]> {
    if (!normalizedFolder) {
      const resources = await this.listResourcesByType(resourceType);
      return resources.filter((resource) => !resource.public_id.includes('/'));
    }

    const prefix = `${normalizedFolder.replace(/\/+$/, '')}/`;
    const resources = await this.listResourcesByType(resourceType, prefix);

    if (includeDescendants) {
      return resources;
    }

    return resources.filter((resource) => {
      const relativePath = resource.public_id.slice(prefix.length);
      return relativePath.length > 0 && !relativePath.includes('/');
    });
  }

  private async listResourcesByType(resourceType: CloudinaryResourceType, prefix?: string): Promise<CloudinaryResourcePayload[]> {
    const resources: CloudinaryResourcePayload[] = [];
    let nextCursor: string | undefined;

    do {
      const response = (await cloudinary.api.resources({
        type: 'upload',
        resource_type: resourceType,
        prefix,
        max_results: CLOUDINARY_MAX_RESULTS,
        next_cursor: nextCursor,
      })) as CloudinaryResourceListResponse;

      if (Array.isArray(response?.resources)) {
        resources.push(...response.resources.map((resource) => mapCloudinaryResource(resource)));
      }

      nextCursor = typeof response?.next_cursor === 'string' ? response.next_cursor : undefined;
    } while (nextCursor);

    const deduped = new Map(resources.map((resource) => [resource.public_id, resource]));
    return [...deduped.values()];
  }

  private async listResourcesByAssetFolder(assetFolder: string): Promise<CloudinaryResourcePayload[]> {
    const expression = `asset_folder="${escapeSearchValue(assetFolder)}"`;
    const resources: CloudinaryResourcePayload[] = [];
    let nextCursor: string | undefined;

    do {
      let query = cloudinary.search.expression(expression).max_results(CLOUDINARY_MAX_RESULTS) as CloudinarySearchQuery;
      if (nextCursor) {
        query = query.next_cursor(nextCursor);
      }

      const result = await query.execute();

      if (Array.isArray(result?.resources)) {
        const matchedResources = result.resources
          .map((resource) => mapCloudinaryResource(resource))
          .filter((resource) => normalizePath(resource.asset_folder) === assetFolder);
        resources.push(...matchedResources);
      }

      nextCursor = typeof result?.next_cursor === 'string' ? result.next_cursor : undefined;
    } while (nextCursor);

    const deduped = new Map(resources.map((resource) => [resource.public_id, resource]));
    return [...deduped.values()];
  }

  private ensureConfigured() {
    if (!this.hasCredentials) {
      throw new InternalServerErrorException('Cloudinary credentials are not configured on the server');
    }
  }
}
