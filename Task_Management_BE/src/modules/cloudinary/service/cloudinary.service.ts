import { Injectable } from '@nestjs/common';
import { FilesService } from '../../files/service/files.service';

@Injectable()
export class CloudinaryService {
  constructor(private readonly filesService: FilesService) {}

  async listFolders(userId: string, projectId: string, parentPath?: string) {
    return this.filesService.listCloudinaryFolders(userId, projectId, parentPath);
  }

  async listFiles(userId: string, projectId: string, folderPath?: string) {
    return this.filesService.listCloudinaryResources(userId, { projectId, folderPath });
  }
}
