import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CreateFolderDto } from './dto/create-folder.dto';
import { DeleteFolderDto } from './dto/delete-folder.dto';
import { ListFolderFilesQueryDto } from './dto/list-folder-files-query.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import { CloudinaryResourceType, UploadFileDto } from './dto/upload-file.dto';

interface CloudinaryFolderItem {
  name: string;
  path: string;
}

interface CloudinaryResourceItem {
  public_id: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  secure_url?: string;
  created_at?: string;
}

interface CloudinaryErrorPayload {
  message: string;
  http_code?: number;
}

interface CloudinaryFolderListResponse {
  folders?: CloudinaryFolderItem[];
  next_cursor?: string;
}

interface CloudinaryResourceListResponse {
  resources?: CloudinaryResourceItem[];
  next_cursor?: string;
}

interface CloudinaryDeleteResourceResponse {
  result?: string;
}

interface UploadedMemoryFile {
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    this.configureCloudinary();
  }

  async uploadFile(file: UploadedMemoryFile, dto: UploadFileDto) {
    const tags = this.parseTags(dto.tags);

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: dto.folder,
          public_id: dto.publicId,
          resource_type: dto.resourceType ?? CloudinaryResourceType.AUTO,
          overwrite: dto.overwrite,
          tags,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error('Upload failed without result'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(file.buffer);
    }).catch((error: unknown) => this.handleCloudinaryError(error));

    return {
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      secureUrl: uploadResult.secure_url,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      folder: uploadResult.folder,
    };
  }

  async deleteFile(publicId: string) {
    const normalizedPublicId = this.normalizePath(publicId);

    const resourceTypes: Array<CloudinaryResourceType.IMAGE | CloudinaryResourceType.VIDEO | CloudinaryResourceType.RAW> = [
      CloudinaryResourceType.IMAGE,
      CloudinaryResourceType.VIDEO,
      CloudinaryResourceType.RAW,
    ];

    for (const resourceType of resourceTypes) {
      const response = await this.destroyResource(normalizedPublicId, resourceType);

      if (response.result === 'ok') {
        return {
          publicId: normalizedPublicId,
          deleted: true,
          resourceType,
        };
      }
    }

    throw new NotFoundException('File not found');
  }

  async listFolders() {
    const response = await cloudinary.api
      .root_folders()
      .catch((error: unknown) => this.handleCloudinaryError(error));

    const parsed = this.toFolderListResponse(response);

    return {
      folders: (parsed.folders ?? []).map((folder) => ({
        name: folder.name,
        path: folder.path,
      })),
      nextCursor: parsed.next_cursor,
    };
  }

  async createFolder(dto: CreateFolderDto) {
    const path = this.normalizePath(dto.path);

    const response = await cloudinary.api
      .create_folder(path)
      .catch((error: unknown) => this.handleCloudinaryError(error));

    const folder = this.toFolderItem(response);

    return {
      name: folder.name,
      path: folder.path,
    };
  }

  async renameFolder(dto: RenameFolderDto) {
    const fromPath = this.normalizePath(dto.fromPath);
    const toPath = this.normalizePath(dto.toPath);

    await cloudinary.api
      .rename_folder(fromPath, toPath)
      .catch((error: unknown) => this.handleCloudinaryError(error));

    return {
      fromPath,
      toPath,
      renamed: true,
    };
  }

  async deleteFolder(dto: DeleteFolderDto) {
    const path = this.normalizePath(dto.path);

    await cloudinary.api
      .delete_folder(path)
      .catch((error: unknown) => this.handleCloudinaryError(error));

    return {
      path,
      deleted: true,
    };
  }

  async listFolderFiles(query: ListFolderFilesQueryDto) {
    const folder = this.normalizePath(query.folder);

    const response = await cloudinary.api
      .resources({
        type: 'upload',
        prefix: `${folder}/`,
        max_results: query.maxResults,
        next_cursor: query.nextCursor,
      })
      .catch((error: unknown) => this.handleCloudinaryError(error));

    const parsed = this.toResourceListResponse(response);

    return {
      files: (parsed.resources ?? []).map((resource) => ({
        publicId: resource.public_id,
        format: resource.format,
        resourceType: resource.resource_type,
        bytes: resource.bytes,
        secureUrl: resource.secure_url,
        createdAt: resource.created_at,
      })),
      nextCursor: parsed.next_cursor,
    };
  }

  async deleteFolderRecursive(dto: DeleteFolderDto) {
    const path = this.normalizePath(dto.path);

    const deletedResources =
      (await this.deleteResourcesByPrefix(path, CloudinaryResourceType.IMAGE)) +
      (await this.deleteResourcesByPrefix(path, CloudinaryResourceType.VIDEO)) +
      (await this.deleteResourcesByPrefix(path, CloudinaryResourceType.RAW));

    const subFolders = await this.getAllSubFolders(path);

    let deletedFolders = 0;
    for (const folderPath of subFolders.sort((a, b) => b.split('/').length - a.split('/').length)) {
      await cloudinary.api
        .delete_folder(folderPath)
        .catch((error: unknown) => this.handleCloudinaryError(error));
      deletedFolders += 1;
    }

    await cloudinary.api
      .delete_folder(path)
      .catch((error: unknown) => this.handleCloudinaryError(error));

    return {
      path,
      deletedResources,
      deletedFolders: deletedFolders + 1,
      deleted: true,
    };
  }

  private async destroyResource(
    publicId: string,
    resourceType: CloudinaryResourceType.IMAGE | CloudinaryResourceType.VIDEO | CloudinaryResourceType.RAW,
  ) {
    const response = await cloudinary.uploader
      .destroy(publicId, { resource_type: resourceType, invalidate: true })
      .catch((error: unknown) => this.handleCloudinaryError(error));

    return this.toDeleteResourceResponse(response);
  }

  private async deleteResourcesByPrefix(path: string, resourceType: CloudinaryResourceType.IMAGE | CloudinaryResourceType.VIDEO | CloudinaryResourceType.RAW) {
    const result = await cloudinary.api
      .delete_resources_by_prefix(`${path}/`, {
        resource_type: resourceType,
        type: 'upload',
        invalidate: true,
      })
      .catch((error: unknown) => this.handleCloudinaryError(error));

    const deleted = this.readRecord(this.readUnknown(result, 'deleted'));
    return Object.keys(deleted).length;
  }

  private async getAllSubFolders(path: string) {
    const allSubFolders: string[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await cloudinary.api
        .sub_folders(path, {
          max_results: 500,
          next_cursor: nextCursor,
        })
        .catch((error: unknown) => this.handleCloudinaryError(error));

      const parsed = this.toFolderListResponse(response);
      const currentPaths = (parsed.folders ?? []).map((folder) => folder.path);
      allSubFolders.push(...currentPaths);
      nextCursor = parsed.next_cursor;
    } while (nextCursor);

    for (const folderPath of [...allSubFolders]) {
      const nestedFolders = await this.getAllSubFolders(folderPath);
      allSubFolders.push(...nestedFolders);
    }

    return Array.from(new Set(allSubFolders));
  }

  private configureCloudinary() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('Cloudinary environment variables are not fully configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private parseTags(tags?: string) {
    if (!tags) {
      return undefined;
    }

    const parsed = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    return parsed.length > 0 ? parsed : undefined;
  }

  private normalizePath(value: string) {
    return value.trim().replace(/^\/+|\/+$/g, '');
  }

  private handleCloudinaryError(error: unknown): never {
    const payload = this.toErrorPayload(error);
    const statusCode = payload.http_code;

    if (statusCode === 400) {
      throw new BadRequestException(payload.message);
    }

    if (statusCode === 401) {
      throw new UnauthorizedException(payload.message);
    }

    if (statusCode === 403) {
      throw new ForbiddenException(payload.message);
    }

    if (statusCode === 404) {
      throw new NotFoundException(payload.message);
    }

    if (statusCode === 409) {
      throw new ConflictException(payload.message);
    }

    if (statusCode === 429) {
      throw new HttpException(payload.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    throw new InternalServerErrorException(payload.message || 'Cloudinary request failed');
  }

  private toErrorPayload(error: unknown): CloudinaryErrorPayload {
    if (error && typeof error === 'object') {
      const message = this.readString(error, 'message') ?? 'Cloudinary request failed';
      const httpCode = this.readNumber(error, 'http_code');
      return {
        message,
        http_code: httpCode,
      };
    }

    return { message: 'Cloudinary request failed' };
  }

  private toFolderListResponse(value: unknown): CloudinaryFolderListResponse {
    return {
      folders: this.readFolderItems(this.readUnknown(value, 'folders')),
      next_cursor: this.readString(value, 'next_cursor'),
    };
  }

  private toResourceListResponse(value: unknown): CloudinaryResourceListResponse {
    return {
      resources: this.readResourceItems(this.readUnknown(value, 'resources')),
      next_cursor: this.readString(value, 'next_cursor'),
    };
  }

  private toFolderItem(value: unknown): CloudinaryFolderItem {
    const name = this.readString(value, 'name');
    const path = this.readString(value, 'path');

    if (!name || !path) {
      throw new InternalServerErrorException('Invalid Cloudinary folder response');
    }

    return { name, path };
  }

  private toDeleteResourceResponse(value: unknown): CloudinaryDeleteResourceResponse {
    return {
      result: this.readString(value, 'result'),
    };
  }

  private readFolderItems(value: unknown): CloudinaryFolderItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.tryParseFolder(item))
      .filter((item): item is CloudinaryFolderItem => item !== null);
  }

  private readResourceItems(value: unknown): CloudinaryResourceItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.tryParseResource(item))
      .filter((item): item is CloudinaryResourceItem => item !== null);
  }

  private tryParseFolder(value: unknown): CloudinaryFolderItem | null {
    const name = this.readString(value, 'name');
    const path = this.readString(value, 'path');

    if (!name || !path) {
      return null;
    }

    return { name, path };
  }

  private tryParseResource(value: unknown): CloudinaryResourceItem | null {
    const publicId = this.readString(value, 'public_id');

    if (!publicId) {
      return null;
    }

    return {
      public_id: publicId,
      format: this.readString(value, 'format'),
      resource_type: this.readString(value, 'resource_type'),
      bytes: this.readNumber(value, 'bytes'),
      secure_url: this.readString(value, 'secure_url'),
      created_at: this.readString(value, 'created_at'),
    };
  }

  private readUnknown(value: unknown, key: string): unknown {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    return record[key];
  }

  private readString(value: unknown, key: string): string | undefined {
    const readValue = this.readUnknown(value, key);
    return typeof readValue === 'string' ? readValue : undefined;
  }

  private readNumber(value: unknown, key: string): number | undefined {
    const readValue = this.readUnknown(value, key);
    return typeof readValue === 'number' ? readValue : undefined;
  }

  private readRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return value as Record<string, unknown>;
  }
}
