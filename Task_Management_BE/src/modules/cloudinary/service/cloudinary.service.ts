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
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { CreateFolderDto } from "../dto/create-folder.dto";
import { DeleteFolderDto } from "../dto/delete-folder.dto";
import { ListFolderFilesQueryDto } from "../dto/list-folder-files-query.dto";
import { RenameFolderDto } from "../dto/rename-folder.dto";
import { CloudinaryResourceType, UploadFileDto } from "../dto/upload-file.dto";
import {
  CloudinaryDeleteResourceResponse,
  CloudinaryErrorPayload,
  CloudinaryFolderItem,
  CloudinaryFolderListResponse,
  CloudinaryResourceItem,
  CloudinaryResourceListResponse,
  UploadedMemoryFile,
} from "../types/cloudinary.types";

const DEFAULT_CLOUDINARY_ALLOWED_PREFIXES = ["tasks", "projects", "avatars"];

@Injectable()
export class CloudinaryService {
  private readonly allowedPathPrefixes: string[];

  constructor(private readonly configService: ConfigService) {
    this.configureCloudinary();
    this.allowedPathPrefixes = this.resolveAllowedPathPrefixes();
  }

  async uploadFile(file: UploadedMemoryFile, dto: UploadFileDto) {
    const folder = dto.folder
      ? this.validateAllowedPath(dto.folder, "folder")
      : undefined;
    const publicId = dto.publicId
      ? this.validateAllowedPath(dto.publicId, "publicId")
      : undefined;

    const uploadResult = await this.executeCloudinary(
      () =>
        new Promise<UploadApiResponse>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: publicId,
              resource_type: dto.resourceType ?? CloudinaryResourceType.AUTO,
              overwrite: dto.overwrite,
              tags: dto.tags,
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) {
                return reject(new Error("Cloudinary returned empty result"));
              }
              resolve(result);
            },
          );
          stream.end(file.buffer);
        }),
      "Failed to upload file to Cloudinary",
    );

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
    const normalizedPublicId = this.validateAllowedPath(publicId, "publicId");
    const resourceTypes: Array<
      | CloudinaryResourceType.IMAGE
      | CloudinaryResourceType.VIDEO
      | CloudinaryResourceType.RAW
    > = [
      CloudinaryResourceType.IMAGE,
      CloudinaryResourceType.VIDEO,
      CloudinaryResourceType.RAW,
    ];

    for (const resourceType of resourceTypes) {
      const response = await this.destroyResource(normalizedPublicId, resourceType);

      if (response.result === "ok") {
        return {
          publicId: normalizedPublicId,
          deleted: true,
          resourceType,
        };
      }
    }

    throw new NotFoundException("File not found");
  }

  async listFolders() {
    const response = await this.executeCloudinary(
      () => cloudinary.api.root_folders(),
      "Failed to fetch folders from Cloudinary",
    );

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
    const folderPath = this.validateAllowedPath(dto.path, "path");
    const response = await this.executeCloudinary(
      () => cloudinary.api.create_folder(folderPath),
      "Cloudinary returned empty create folder response",
    );

    const folder = this.toFolderItem(response);

    return {
      name: folder.name,
      path: folder.path,
    };
  }

  async renameFolder(dto: RenameFolderDto) {
    const fromPath = this.validateAllowedPath(dto.fromPath, "fromPath");
    const toPath = this.validateAllowedPath(dto.toPath, "toPath");

    await this.executeCloudinary(
      () => cloudinary.api.rename_folder(fromPath, toPath),
      "Cloudinary returned empty rename folder response",
    );

    return {
      fromPath,
      toPath,
      renamed: true,
    };
  }

  async deleteFolder(dto: DeleteFolderDto) {
    const path = this.validateAllowedPath(dto.path, "path");
    await this.executeCloudinary(
      () => cloudinary.api.delete_folder(path),
      "Cloudinary returned empty delete folder response",
    );

    return {
      path,
      deleted: true,
    };
  }

  async listFolderFiles(query: ListFolderFilesQueryDto) {
    const folder = this.validateAllowedPath(query.folder, "folder");
    const response = await this.executeCloudinary(
      () =>
        cloudinary.api.resources({
          type: "upload",
          prefix: `${folder}/`,
          max_results: query.maxResults,
          next_cursor: query.nextCursor,
        }),
      "Cloudinary returned empty list files response",
    );

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
    const path = this.validateAllowedPath(dto.path, "path");
    const deletedResources =
      (await this.deleteResourcesByPrefix(
        path,
        CloudinaryResourceType.IMAGE,
      )) +
      (await this.deleteResourcesByPrefix(
        path,
        CloudinaryResourceType.VIDEO,
      )) +
      (await this.deleteResourcesByPrefix(
        path,
        CloudinaryResourceType.RAW,
      ));

    const subFolders = await this.getAllSubFolders(path);

    let deletedFolders = 0;
    for (const folderPath of subFolders.sort(
      (a, b) => b.split("/").length - a.split("/").length,
    )) {
      await this.executeCloudinary(
        () => cloudinary.api.delete_folder(folderPath),
        "Cloudinary returned empty delete subfolder response",
      );
      deletedFolders += 1;
    }

    await this.executeCloudinary(
      () => cloudinary.api.delete_folder(path),
      "Cloudinary returned empty delete root folder response",
    );

    return {
      path,
      deletedResources,
      deletedFolders: deletedFolders + 1,
      deleted: true,
    };
  }

  private async destroyResource(
    publicId: string,
    resourceType:
      | CloudinaryResourceType.IMAGE
      | CloudinaryResourceType.VIDEO
      | CloudinaryResourceType.RAW,
  ) {
    const response = await this.executeCloudinary(
      () =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        }),
      "Cloudinary returned empty delete file response",
    );

    return this.toDeleteResourceResponse(response);
  }

  private async deleteResourcesByPrefix(
    path: string,
    resourceType:
      | CloudinaryResourceType.IMAGE
      | CloudinaryResourceType.VIDEO
      | CloudinaryResourceType.RAW,
  ) {
    const result = await this.executeCloudinary(
      () =>
        cloudinary.api.delete_resources_by_prefix(`${path}/`, {
          resource_type: resourceType,
          type: "upload",
          invalidate: true,
        }),
      "Cloudinary returned empty delete resources response",
    );

    const deleted = this.readRecord(this.readUnknown(result, "deleted"));
    return Object.keys(deleted).length;
  }

  private async getAllSubFolders(path: string) {
    const allSubFolders: string[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await this.executeCloudinary(
        () =>
          cloudinary.api.sub_folders(path, {
            max_results: 500,
            next_cursor: nextCursor,
          }),
        "Cloudinary returned empty subfolders response",
      );

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
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        "Cloudinary environment variables are not fully configured",
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private resolveAllowedPathPrefixes(): string[] {
    const rawPrefixes = this.configService.get<string>(
      "CLOUDINARY_ALLOWED_PREFIXES",
    );

    const prefixes = (rawPrefixes ?? DEFAULT_CLOUDINARY_ALLOWED_PREFIXES.join(","))
      .split(",")
      .map((prefix) => this.normalizePath(prefix).toLowerCase())
      .filter((prefix) => prefix.length > 0);

    if (prefixes.length === 0) {
      throw new InternalServerErrorException(
        "CLOUDINARY_ALLOWED_PREFIXES cannot be empty",
      );
    }

    return Array.from(new Set(prefixes));
  }

  private validateAllowedPath(path: string, fieldName: string): string {
    const normalizedPath = this.normalizePath(path);

    if (!normalizedPath) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    if (normalizedPath.includes("..") || normalizedPath.includes("\\")) {
      throw new BadRequestException(`${fieldName} contains invalid path segments`);
    }

    const normalizedLowerPath = normalizedPath.toLowerCase();
    const isAllowed = this.allowedPathPrefixes.some(
      (prefix) =>
        normalizedLowerPath === prefix || normalizedLowerPath.startsWith(`${prefix}/`),
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        `${fieldName} must start with one of: ${this.allowedPathPrefixes.join(", ")}`,
      );
    }

    return normalizedPath;
  }

  private normalizePath(path: string): string {
    return path.trim().replace(/^\/+|\/+$/g, "");
  }

  private async executeCloudinary<T>(
    operation: () => Promise<T>,
    emptyResultMessage: string,
  ): Promise<T> {
    try {
      const result = await operation();

      if (result === null || result === undefined) {
        throw new InternalServerErrorException(emptyResultMessage);
      }

      return result;
    } catch (error) {
      this.handleCloudinaryError(error);
    }
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

    throw new InternalServerErrorException(
      payload.message || "Cloudinary request failed",
    );
  }

  private toErrorPayload(error: unknown): CloudinaryErrorPayload {
    if (error && typeof error === "object") {
      const message =
        this.readString(error, "message") ?? "Cloudinary request failed";
      const httpCode = this.readNumber(error, "http_code");
      return {
        message,
        http_code: httpCode,
      };
    }

    return { message: "Cloudinary request failed" };
  }

  private toFolderListResponse(value: unknown): CloudinaryFolderListResponse {
    return {
      folders: this.readFolderItems(this.readUnknown(value, "folders")),
      next_cursor: this.readString(value, "next_cursor"),
    };
  }

  private toResourceListResponse(
    value: unknown,
  ): CloudinaryResourceListResponse {
    return {
      resources: this.readResourceItems(this.readUnknown(value, "resources")),
      next_cursor: this.readString(value, "next_cursor"),
    };
  }

  private toFolderItem(value: unknown): CloudinaryFolderItem {
    const name = this.readString(value, "name");
    const path = this.readString(value, "path");

    if (!name || !path) {
      throw new InternalServerErrorException(
        "Invalid Cloudinary folder response",
      );
    }

    return { name, path };
  }

  private toDeleteResourceResponse(
    value: unknown,
  ): CloudinaryDeleteResourceResponse {
    return {
      result: this.readString(value, "result"),
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
    const name = this.readString(value, "name");
    const path = this.readString(value, "path");

    if (!name || !path) {
      return null;
    }

    return { name, path };
  }

  private tryParseResource(value: unknown): CloudinaryResourceItem | null {
    const publicId = this.readString(value, "public_id");

    if (!publicId) {
      return null;
    }

    return {
      public_id: publicId,
      format: this.readString(value, "format"),
      resource_type: this.readString(value, "resource_type"),
      bytes: this.readNumber(value, "bytes"),
      secure_url: this.readString(value, "secure_url"),
      created_at: this.readString(value, "created_at"),
    };
  }

  private readUnknown(value: unknown, key: string): unknown {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    return record[key];
  }

  private readString(value: unknown, key: string): string | undefined {
    const readValue = this.readUnknown(value, key);
    return typeof readValue === "string" ? readValue : undefined;
  }

  private readNumber(value: unknown, key: string): number | undefined {
    const readValue = this.readUnknown(value, key);
    return typeof readValue === "number" ? readValue : undefined;
  }

  private readRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object") {
      return {};
    }

    return value as Record<string, unknown>;
  }
}
