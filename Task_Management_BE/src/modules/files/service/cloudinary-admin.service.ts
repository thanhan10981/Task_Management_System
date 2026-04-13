import { Injectable } from '@nestjs/common';
import {
  CloudinaryFolderPayload,
  CloudinaryFolderWithCountPayload,
  CloudinaryResourcePayload,
  CloudinaryResourceType,
} from '../types/cloudinary.types';
import { CloudinaryFolderService } from './cloudinary-folder.service';
import { CloudinaryResourceService } from './cloudinary-resource.service';

@Injectable()
export class CloudinaryAdminService {
  constructor(
    private readonly cloudinaryFolderService: CloudinaryFolderService,
    private readonly cloudinaryResourceService: CloudinaryResourceService,
  ) {}

  async deleteAsset(publicId: string, resourceType: CloudinaryResourceType = 'image') {
    return this.cloudinaryResourceService.deleteAsset(publicId, resourceType);
  }

  async createFolder(folderPath: string): Promise<CloudinaryFolderPayload> {
    return this.cloudinaryFolderService.createFolder(folderPath);
  }

  async listFolders(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    return this.cloudinaryFolderService.listFolders(parentPath);
  }

  async listFoldersRecursive(parentPath?: string): Promise<CloudinaryFolderPayload[]> {
    return this.cloudinaryFolderService.listFoldersRecursive(parentPath);
  }

  async listFoldersWithCounts(parentPath?: string, recursive = false): Promise<CloudinaryFolderWithCountPayload[]> {
    return this.cloudinaryFolderService.listFoldersWithCounts(parentPath, recursive);
  }

  async listResources(folderPath?: string, includeDescendants = false): Promise<CloudinaryResourcePayload[]> {
    return this.cloudinaryResourceService.listResources(folderPath, includeDescendants);
  }

  async getResource(publicId: string, resourceType?: string): Promise<CloudinaryResourcePayload | null> {
    return this.cloudinaryResourceService.getResource(publicId, resourceType);
  }
}
