import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../config/redis/redis.constants';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateFileRecordDto } from '../dto/create-file-record.dto';
import { CreateUploadSignatureDto } from '../dto/create-upload-signature.dto';
import { FinalizeUploadDto } from '../dto/finalize-upload.dto';
import { UploadProjectFileDto } from '../dto/upload-project-file.dto';
import { FilesRepository } from '../repository/files.repository';
import { CloudinaryFileManagerService } from './cloudinary-file-manager.service';

interface ListCloudinaryResourcesParams {
  projectId: string;
  folderPath?: string;
  includeDescendants?: boolean;
}

interface CreateCloudinaryFolderParams {
  projectId: string;
  path: string;
}

type UploadedProjectFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

type PendingUpload = {
  userId: string;
  projectId: string;
  taskId?: string;
  folderPath: string;
  scopedFolder: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  resourceType: 'image' | 'video' | 'raw';
  enforcedFormat?: 'pdf';
};

type UploaderProfile = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
};

const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PENDING_UPLOAD_TTL_SECONDS = 10 * 60;

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesRepository: FilesRepository,
    private readonly cloudinaryFileManagerService: CloudinaryFileManagerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async createUploadSignature(userId: string, dto: CreateUploadSignatureDto) {
    await this.ensureProjectAccess(userId, dto.projectId);
    await this.ensureTaskBelongsToProject(userId, dto.taskId, dto.projectId);
    this.validateUploadFile(dto.fileName, dto.mimeType, dto.sizeBytes);

    const logicalFolderPath = this.cloudinaryFileManagerService.normalizePath(dto.folderPath) || 'tasks';
    const fileKind = this.cloudinaryFileManagerService.resolveSupportedFileKind(dto.fileName, dto.mimeType);
    const signedUpload = this.cloudinaryFileManagerService.createSignedUploadParams({
      originalFilename: dto.fileName,
      mimeType: dto.mimeType,
      projectId: dto.projectId,
      folderPath: logicalFolderPath,
    });
    const uploadId = randomUUID();
    const pendingUpload: PendingUpload = {
      userId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      folderPath: logicalFolderPath,
      scopedFolder: signedUpload.folder,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      resourceType: fileKind.resourceType,
      enforcedFormat: fileKind.enforcedFormat,
    };

    await this.redis.set(
      this.pendingUploadKey(uploadId),
      JSON.stringify(pendingUpload),
      'EX',
      PENDING_UPLOAD_TTL_SECONDS,
    );

    return {
      uploadId,
      ...signedUpload,
      expiresInSeconds: PENDING_UPLOAD_TTL_SECONDS,
    };
  }

  async uploadProfileImage(userId: string, kind: string | undefined, file: UploadedProjectFile) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const normalizedKind = kind === 'cover' ? 'cover' : kind === 'avatar' ? 'avatar' : null;
    if (!normalizedKind) {
      throw new BadRequestException('Profile image kind must be avatar or cover');
    }

    this.validateProfileImage(file.originalname, file.mimetype, file.buffer.length);

    const uploaded = await this.cloudinaryFileManagerService.uploadProfileImage({
      fileBuffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      userId,
      kind: normalizedKind,
    });

    return {
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      format: uploaded.format,
      resourceType: uploaded.resource_type,
      bytes: uploaded.bytes,
      kind: normalizedKind,
    };
  }

  async finalizeUpload(userId: string, dto: FinalizeUploadDto) {
    const pendingUpload = await this.resolvePendingUpload(userId, dto);

    try {
      await this.ensureProjectAccess(userId, pendingUpload.projectId);
      await this.ensureTaskBelongsToProject(userId, pendingUpload.taskId, pendingUpload.projectId);

      this.verifyFinalizedUploadPayload(pendingUpload, dto);

      const fileRecord = await this.filesRepository.createFileMetadata({
        fileName: pendingUpload.fileName || dto.originalFilename || this.cloudinaryFileManagerService.extractFileName(dto.publicId),
        fileUrl: dto.secureUrl,
        fileType: dto.format
          ?? pendingUpload.enforcedFormat
          ?? this.cloudinaryFileManagerService.extractFileExtension(pendingUpload.fileName)
          ?? this.cloudinaryFileManagerService.extractFileExtension(dto.publicId),
        fileCategory: dto.resourceType ?? pendingUpload.resourceType,
        storageKey: dto.publicId,
        folderPath: this.cloudinaryFileManagerService.resolveLogicalFolderPath(
          pendingUpload.projectId,
          pendingUpload.folderPath,
          dto.publicId,
        ),
        sizeBytes: typeof dto.bytes === 'number' ? BigInt(dto.bytes) : BigInt(pendingUpload.sizeBytes),
        projectId: pendingUpload.projectId,
        taskId: pendingUpload.taskId,
        commentId: dto.commentId,
        uploadedBy: userId,
      });

      await this.redis.del(this.pendingUploadKey(dto.uploadId));
      const uploader = await this.getUploaderProfile(userId);

      return {
        id: fileRecord.id,
        originalFilename: fileRecord.fileName,
        publicId: fileRecord.storageKey,
        resourceType: this.cloudinaryFileManagerService.normalizeStoredResourceType(
          fileRecord.fileCategory,
          fileRecord.fileName,
          fileRecord.fileType,
        ),
        format: this.cloudinaryFileManagerService.normalizeStoredFormat(
          fileRecord.fileType,
          fileRecord.fileName,
          fileRecord.storageKey,
        ) ?? '',
        projectId: fileRecord.projectId,
        taskId: fileRecord.taskId,
        commentId: fileRecord.commentId,
        secureUrl: fileRecord.fileUrl,
        bytes: this.serializeSizeBytes(fileRecord.sizeBytes),
        folderPath: fileRecord.folderPath,
        uploadedBy: userId,
        uploader,
      };
    } catch (error) {
      await this.bestEffortDeletePendingAsset(pendingUpload, dto.publicId, dto.resourceType);
      throw error;
    }
  }

  async create(userId: string, dto: CreateFileRecordDto) {
    const normalizedFolderPath = this.cloudinaryFileManagerService.resolveLogicalFolderPath(
      dto.projectId,
      dto.folderPath,
      dto.publicId,
    );

    await this.ensureProjectAccess(userId, dto.projectId);

    if (dto.taskId) {
      const task = await this.ensureTaskAccess(userId, dto.taskId);
      if (task.projectId !== dto.projectId) {
        throw new BadRequestException('Task does not belong to the provided project');
      }
    }

    const cloudinaryAsset = await this.cloudinaryFileManagerService.getResource(dto.publicId, dto.resourceType);

    if (!cloudinaryAsset) {
      throw new BadRequestException('Cloudinary asset does not exist or is not accessible');
    }

    if (!cloudinaryAsset.public_id) {
      throw new BadRequestException('Cloudinary asset public ID is missing');
    }

    this.logger.log(`Saving metadata from Cloudinary canonical publicId=${cloudinaryAsset.public_id} (requested=${dto.publicId})`);

    const file = await this.filesRepository.createFileMetadata({
      fileName: dto.fileName || this.cloudinaryFileManagerService.extractFileName(cloudinaryAsset.public_id),
      fileUrl: cloudinaryAsset.secure_url ?? dto.secureUrl,
      fileType: cloudinaryAsset.format
        ?? dto.format
        ?? this.cloudinaryFileManagerService.extractFileExtension(dto.fileName)
        ?? this.cloudinaryFileManagerService.extractFileExtension(cloudinaryAsset.public_id),
      fileCategory: cloudinaryAsset.resource_type ?? dto.resourceType,
      storageKey: cloudinaryAsset.public_id,
      folderPath: normalizedFolderPath,
      sizeBytes: typeof cloudinaryAsset.bytes === 'number'
        ? BigInt(cloudinaryAsset.bytes)
        : typeof dto.sizeBytes === 'number'
          ? BigInt(dto.sizeBytes)
          : undefined,
      projectId: dto.projectId,
      taskId: dto.taskId,
      commentId: dto.commentId,
      uploadedBy: userId,
    });

    return {
      id: file.id,
      fileName: file.fileName,
      secureUrl: file.fileUrl,
      publicId: file.storageKey,
      format: this.cloudinaryFileManagerService.normalizeStoredFormat(file.fileType, file.fileName, file.storageKey),
      resourceType: this.cloudinaryFileManagerService.normalizeStoredResourceType(
        file.fileCategory,
        file.fileName,
        file.fileType,
      ),
      folderPath: file.folderPath,
      commentId: file.commentId,
      sizeBytes: this.serializeSizeBytes(file.sizeBytes),
      createdAt: file.createdAt,
      uploadedBy: userId,
      canSaveToProject: true,
    };
  }

  async uploadProjectFile(userId: string, dto: UploadProjectFileDto, file: UploadedProjectFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.validateUploadFile(file.originalname, file.mimetype, file.buffer.length);

    await this.ensureProjectAccess(userId, dto.projectId);

    if (dto.taskId) {
      const task = await this.ensureTaskAccess(userId, dto.taskId);
      if (task.projectId !== dto.projectId) {
        throw new BadRequestException('Task does not belong to the provided project');
      }
    }

    const logicalFolderPath = this.cloudinaryFileManagerService.normalizePath(dto.folderPath) || 'tasks';

    const uploadedAsset = await this.cloudinaryFileManagerService.uploadProjectTaskFile({
      fileBuffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      projectId: dto.projectId,
      folderPath: logicalFolderPath,
    });

    this.logger.log(`Uploaded to Cloudinary with publicId=${uploadedAsset.public_id}, resourceType=${uploadedAsset.resource_type}, format=${uploadedAsset.format}`);

    const fileRecord = await this.filesRepository.createFileMetadata({
      fileName: file.originalname,
      fileUrl: uploadedAsset.secure_url,
      fileType: uploadedAsset.format ?? this.cloudinaryFileManagerService.extractFileExtension(file.originalname),
      fileCategory: uploadedAsset.resource_type,
      storageKey: uploadedAsset.public_id,
      folderPath: this.cloudinaryFileManagerService.resolveLogicalFolderPath(
        dto.projectId,
        logicalFolderPath,
        uploadedAsset.public_id,
      ),
      sizeBytes: typeof uploadedAsset.bytes === 'number' ? BigInt(uploadedAsset.bytes) : undefined,
      projectId: dto.projectId,
      taskId: dto.taskId,
      uploadedBy: userId,
    });
    const uploader = await this.getUploaderProfile(userId);

    return {
      id: fileRecord.id,
      originalFilename: fileRecord.fileName,
      publicId: fileRecord.storageKey,
      resourceType: this.cloudinaryFileManagerService.normalizeStoredResourceType(
        fileRecord.fileCategory,
        fileRecord.fileName,
        fileRecord.fileType,
      ),
      format: this.cloudinaryFileManagerService.normalizeStoredFormat(
        fileRecord.fileType,
        fileRecord.fileName,
        fileRecord.storageKey,
      ),
      projectId: fileRecord.projectId,
      taskId: fileRecord.taskId,
      secureUrl: fileRecord.fileUrl,
      bytes: this.serializeSizeBytes(fileRecord.sizeBytes),
      folderPath: fileRecord.folderPath,
      uploadedBy: userId,
      uploader,
    };
  }

  async getSecurePreviewUrl(userId: string, fileId: string) {
    const file = await this.filesRepository.findActiveFileById(fileId, userId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!file.storageKey) {
      throw new BadRequestException('File metadata is missing public ID');
    }

    await this.ensureProjectAccess(userId, file.projectId);

    const previewOptions = this.cloudinaryFileManagerService.detectPreviewOptions(
      file.fileName,
      file.fileType,
      file.fileCategory,
      file.storageKey,
    );

    if (!previewOptions.canPreview) {
      throw new BadRequestException('Preview is only available for image resources');
    }

    const expiresInSeconds = this.cloudinaryFileManagerService.getDefaultAuthenticatedUrlTtlSeconds();

    this.logger.log(`Generating preview URL for fileId=${file.id}, publicId=${file.storageKey}`);

    const previewUrl = await this.cloudinaryFileManagerService.createPreviewUrl({
      publicId: file.storageKey,
      resourceType: previewOptions.resourceType,
      format: previewOptions.format,
      expiresInSeconds,
    });

    return {
      id: file.id,
      previewUrl,
      expiresInSeconds,
      resourceType: previewOptions.resourceType,
      format: previewOptions.format,
    };
  }

  async getSecureDownloadUrl(userId: string, fileId: string) {
    const file = await this.filesRepository.findActiveFileById(fileId, userId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!file.storageKey) {
      throw new BadRequestException('File metadata is missing public ID');
    }

    await this.ensureProjectAccess(userId, file.projectId);

    const expiresInSeconds = this.cloudinaryFileManagerService.getDefaultAuthenticatedUrlTtlSeconds();

    const resourceType = this.cloudinaryFileManagerService.toAllowedResourceType(file.fileCategory);
    const normalizedFormat = this.cloudinaryFileManagerService.resolveDownloadFormat(
      file.fileName,
      file.fileType,
      resourceType,
      file.storageKey,
    );

    this.logger.log(`Generating download URL for fileId=${file.id}, publicId=${file.storageKey}, resourceType=${resourceType}`);

    const downloadUrl = await this.cloudinaryFileManagerService.createDownloadUrl({
      publicId: file.storageKey,
      resourceType,
      format: normalizedFormat,
      fileName: file.fileName,
      expiresInSeconds,
    });

    const resolvedFileName = this.cloudinaryFileManagerService.resolveDownloadFileName(
      file.fileName,
      normalizedFormat,
      file.storageKey,
    );

    return {
      id: file.id,
      downloadUrl,
      fileName: resolvedFileName,
      expiresInSeconds,
      resourceType,
      format: normalizedFormat,
    };
  }

  async list(userId: string, projectId: string, folderPath?: string, taskId?: string) {
    await this.ensureProjectAccess(userId, projectId);

    const normalizedFolderPath = this.cloudinaryFileManagerService.normalizePath(folderPath);
    if (taskId) {
      const task = await this.ensureTaskAccess(userId, taskId);
      if (task.projectId !== projectId) {
        throw new BadRequestException('Task does not belong to the provided project');
      }
    }

    const files = await this.prisma.file.findMany({
      where: {
        projectId,
        isDeleted: false,
        ...(taskId ? { taskId } : {}),
        ...(normalizedFolderPath
          ? {
              folderPath: {
                equals: normalizedFolderPath,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        storageKey: true,
        fileType: true,
        fileCategory: true,
        sizeBytes: true,
        createdAt: true,
        uploadedBy: true,
        taskId: true,
        commentId: true,
        folderPath: true,
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      files: files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        secureUrl: file.fileUrl,
        publicId: file.storageKey ?? file.id,
        format: this.cloudinaryFileManagerService.normalizeStoredFormat(file.fileType, file.fileName, file.storageKey) ?? '',
        resourceType: this.cloudinaryFileManagerService.normalizeStoredResourceType(
          file.fileCategory,
          file.fileName,
          file.fileType,
        ),
        bytes: this.serializeSizeBytes(file.sizeBytes),
        createdAt: file.createdAt,
        uploadedBy: file.uploadedBy,
        uploader: this.serializeUploaderProfile(file.uploader),
        taskId: file.taskId,
        commentId: file.commentId,
        folderPath: file.folderPath,
        isSaved: true,
        canSaveToProject: true,
      })),
    };
  }

  async listCloudinaryFolders(userId: string, projectId: string, parentPath?: string, recursive = false) {
    await this.ensureProjectAccess(userId, projectId);

    const normalizedParentPath = this.cloudinaryFileManagerService.normalizePath(parentPath);
    const scopedParentPath = this.cloudinaryFileManagerService.toScopedFolderPath(projectId, normalizedParentPath);

    const mergedPaths = new Set<string>();
    const cloudinaryFolders = await this.cloudinaryFileManagerService.listFolders(scopedParentPath, recursive);

    for (const cloudFolder of cloudinaryFolders) {
      const logicalPath = this.cloudinaryFileManagerService.toLogicalFolderPath(projectId, cloudFolder.path);
      if (!logicalPath) {
        continue;
      }

      if (recursive) {
        const descendantPath = this.cloudinaryFileManagerService.deriveDescendantPath(logicalPath, normalizedParentPath);
        if (descendantPath) {
          mergedPaths.add(descendantPath);
        }
      } else {
        const directChild = this.cloudinaryFileManagerService.deriveDirectChildPath(logicalPath, normalizedParentPath);
        if (directChild) {
          mergedPaths.add(directChild);
        }
      }
    }

    const dbFolders = await this.prisma.file.findMany({
      where: {
        projectId,
        isDeleted: false,
        NOT: { folderPath: null },
      },
      select: {
        folderPath: true,
      },
      distinct: ['folderPath'],
    });

    for (const dbFolder of dbFolders) {
      if (!dbFolder.folderPath) {
        continue;
      }

      if (recursive) {
        const descendantPath = this.cloudinaryFileManagerService.deriveDescendantPath(
          dbFolder.folderPath,
          normalizedParentPath,
        );
        if (descendantPath) {
          mergedPaths.add(descendantPath);
        }
      } else {
        const directChild = this.cloudinaryFileManagerService.deriveDirectChildPath(
          dbFolder.folderPath,
          normalizedParentPath,
        );
        if (directChild) {
          mergedPaths.add(directChild);
        }
      }
    }

    const folderPaths = [...mergedPaths];
    const countByPath = await this.countFilesByFolderPath(projectId, folderPaths);

    const folders = [...mergedPaths]
      .sort((a, b) => a.localeCompare(b))
      .map((path) => ({
        path,
        name: path.split('/').pop() || path,
        fileCount: countByPath.get(path) ?? 0,
      }));

    return {
      folders,
      canSaveToProject: true,
      requestedBy: userId,
    };
  }

  async listCloudinaryResources(userId: string, params: ListCloudinaryResourcesParams) {
    await this.ensureProjectAccess(userId, params.projectId);

    const normalizedFolderPath = this.cloudinaryFileManagerService.normalizePath(params.folderPath);
    const includeDescendants = params.includeDescendants ?? true;
    const savedFiles = await this.prisma.file.findMany({
      where: {
        isDeleted: false,
        projectId: params.projectId,
        ...(normalizedFolderPath
          ? includeDescendants
            ? {
                OR: [
                  {
                    folderPath: {
                      equals: normalizedFolderPath,
                      mode: 'insensitive',
                    },
                  },
                  {
                    folderPath: {
                      startsWith: `${normalizedFolderPath}/`,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {
                folderPath: {
                  equals: normalizedFolderPath,
                  mode: 'insensitive',
                },
              }
          : {}),
      },
      select: {
        id: true,
        storageKey: true,
        fileName: true,
        uploadedBy: true,
        projectId: true,
        createdAt: true,
        folderPath: true,
        fileType: true,
        fileCategory: true,
        sizeBytes: true,
        commentId: true,
        fileUrl: true,
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      files: savedFiles.map((savedFile) => ({
        id: savedFile.id,
        fileName: savedFile.fileName ?? this.cloudinaryFileManagerService.extractFileName(savedFile.storageKey ?? ''),
        publicId: savedFile.storageKey ?? '',
        format: this.cloudinaryFileManagerService.normalizeStoredFormat(
          savedFile.fileType,
          savedFile.fileName,
          savedFile.storageKey,
        ) ?? '',
        resourceType: this.cloudinaryFileManagerService.normalizeStoredResourceType(
          savedFile.fileCategory,
          savedFile.fileName,
          savedFile.fileType,
        ),
        bytes: this.serializeSizeBytes(savedFile.sizeBytes),
        secureUrl: savedFile.fileUrl ?? '',
        createdAt: savedFile.createdAt ?? null,
        uploadedBy: savedFile.uploadedBy ?? null,
        uploader: this.serializeUploaderProfile(savedFile.uploader),
        isSaved: true,
        canSaveToProject: true,
        projectId: savedFile.projectId,
        commentId: savedFile.commentId,
        folderPath: this.cloudinaryFileManagerService.normalizePath(savedFile.folderPath) ?? '',
      })),
      requestedBy: userId,
    };
  }

  async createCloudinaryFolder(userId: string, params: CreateCloudinaryFolderParams) {
    await this.ensureProjectAccess(userId, params.projectId);

    const normalizedPath = this.cloudinaryFileManagerService.ensureFolderPath(params.path);
    const scopedFolderPath = this.cloudinaryFileManagerService.toScopedFolderPath(params.projectId, normalizedPath);
    const folder = await this.cloudinaryFileManagerService.createFolder(scopedFolderPath);

    return {
      folder: {
        ...folder,
        path: normalizedPath,
      },
      requestedBy: userId,
      canSaveToProject: true,
    };
  }

  async delete(userId: string, fileId: string) {
    const file = await this.filesRepository.findActiveFileById(fileId, userId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.ensureProjectAccess(userId, file.projectId);
    if (file.uploadedBy !== userId) {
      throw new ForbiddenException('You can only delete files you uploaded');
    }

    let cloudinaryDeleted = false;

    if (file.storageKey) {
      try {
        await this.cloudinaryFileManagerService.deleteAsset(
          file.storageKey,
          this.cloudinaryFileManagerService.toAllowedResourceType(file.fileCategory),
        );
        cloudinaryDeleted = true;
      } catch (error) {
        this.logger.warn(
          `Cloudinary delete failed for fileId=${file.id}, publicId=${file.storageKey}. Proceeding with database deletion.`,
        );
        if (error instanceof Error) {
          this.logger.warn(error.message);
        }
      }
    }

    await this.filesRepository.deleteFileById(fileId, userId);

    return {
      message: cloudinaryDeleted
        ? 'File deleted from Cloudinary and database'
        : 'File deleted from database. Cloudinary asset was missing or could not be deleted.',
    };
  }


  // Convert bigint-like values into JSON-safe primitives while preserving precision for large values.
  private serializeSizeBytes(sizeBytes?: bigint | string | number | null): number | string {
    if (sizeBytes === null || sizeBytes === undefined) {
      return 0;
    }

    try {
      const normalized = typeof sizeBytes === 'bigint'
        ? sizeBytes
        : typeof sizeBytes === 'number'
          ? BigInt(sizeBytes)
          : BigInt(sizeBytes);

      if (normalized <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(normalized);
      }

      return normalized.toString();
    } catch {
      return 0;
    }
  }


  private async countFilesByFolderPath(projectId: string, folderPaths: string[]): Promise<Map<string, number>> {
    if (!folderPaths.length) {
      return new Map();
    }

    const uniqueFolders = [
      ...new Set(
        folderPaths
          .map((path) => this.cloudinaryFileManagerService.normalizePath(path))
          .filter((path): path is string => Boolean(path)),
      ),
    ];

    if (!uniqueFolders.length) {
      return new Map();
    }

    const grouped = await this.prisma.file.groupBy({
      by: ['folderPath'],
      where: {
        projectId,
        isDeleted: false,
        folderPath: { in: uniqueFolders },
      },
      _count: {
        _all: true,
      },
    });

    const byPath = new Map<string, number>();
    for (const row of grouped) {
      const normalized = this.cloudinaryFileManagerService.normalizePath(row.folderPath);
      if (!normalized) {
        continue;
      }

      byPath.set(normalized, row._count._all);
    }

    return byPath;
  }

  private validateUploadFile(fileName: string, mimeType: string, sizeBytes: number) {
    if (!fileName?.trim()) {
      throw new BadRequestException('File name is required');
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException('File size is invalid');
    }

    if (sizeBytes > MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 20MB limit');
    }

    const extension = this.cloudinaryFileManagerService.extractFileExtension(fileName);
    const normalizedMime = mimeType.toLowerCase();
    const knownRawExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z']);
    const knownImageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff']);
    const knownVideoExtensions = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi']);
    const knownRawMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ]);
    const isKnownExtension = extension
      ? knownRawExtensions.has(extension) || knownImageExtensions.has(extension) || knownVideoExtensions.has(extension)
      : false;
    const isKnownMimeType = normalizedMime.startsWith('image/')
      || normalizedMime.startsWith('video/')
      || knownRawMimeTypes.has(normalizedMime);

    if (!isKnownExtension && !isKnownMimeType) {
      throw new BadRequestException('Unsupported file type');
    }
  }

  private validateProfileImage(fileName: string, mimeType: string, sizeBytes: number) {
    if (!fileName?.trim()) {
      throw new BadRequestException('File name is required');
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException('File size is invalid');
    }

    if (sizeBytes > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Profile image exceeds 5MB limit');
    }

    const extension = this.cloudinaryFileManagerService.extractFileExtension(fileName);
    const normalizedMime = mimeType.toLowerCase();
    const knownImageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg']);
    const isKnownImage = normalizedMime.startsWith('image/') || (extension ? knownImageExtensions.has(extension) : false);

    if (!isKnownImage) {
      throw new BadRequestException('Profile image must be an image file');
    }
  }

  private async resolvePendingUpload(userId: string, dto: FinalizeUploadDto): Promise<PendingUpload> {
    const rawPendingUpload = await this.redis.get(this.pendingUploadKey(dto.uploadId));
    if (!rawPendingUpload) {
      throw new BadRequestException('Upload signature is expired or invalid');
    }

    let pendingUpload: PendingUpload;
    try {
      pendingUpload = JSON.parse(rawPendingUpload) as PendingUpload;
    } catch {
      await this.redis.del(this.pendingUploadKey(dto.uploadId));
      throw new BadRequestException('Upload signature is invalid');
    }

    if (pendingUpload.userId !== userId || pendingUpload.projectId !== dto.projectId) {
      throw new ForbiddenException('Upload signature does not belong to this user or project');
    }

    return pendingUpload;
  }

  private verifyFinalizedUploadPayload(
    pendingUpload: PendingUpload,
    dto: FinalizeUploadDto,
  ) {
    if (!dto.publicId.startsWith(`${pendingUpload.scopedFolder}/`)) {
      throw new BadRequestException('Cloudinary asset is outside the signed upload folder');
    }

    const actualResourceType = this.cloudinaryFileManagerService.toAllowedResourceType(dto.resourceType);
    if (actualResourceType !== pendingUpload.resourceType) {
      throw new BadRequestException('Cloudinary asset resource type mismatch');
    }

    if (pendingUpload.enforcedFormat && dto.format?.toLowerCase() !== pendingUpload.enforcedFormat) {
      throw new BadRequestException('Cloudinary asset format mismatch');
    }

    if (typeof dto.bytes === 'number') {
      if (dto.bytes <= 0 || dto.bytes > MAX_UPLOAD_FILE_SIZE_BYTES) {
        throw new BadRequestException('Cloudinary asset size is invalid');
      }

      if (dto.bytes > pendingUpload.sizeBytes) {
        throw new BadRequestException('Cloudinary asset size does not match the signed upload');
      }
    }
  }

  private async bestEffortDeletePendingAsset(pendingUpload: PendingUpload, publicId?: string, resourceType?: string) {
    if (!publicId || !publicId.startsWith(`${pendingUpload.scopedFolder}/`)) {
      return;
    }

    try {
      await this.cloudinaryFileManagerService.deleteAsset(
        publicId,
        this.cloudinaryFileManagerService.toAllowedResourceType(resourceType ?? pendingUpload.resourceType),
      );
    } catch (error) {
      this.logger.warn(`Failed to clean up rejected Cloudinary upload publicId=${publicId}`);
      if (error instanceof Error) {
        this.logger.warn(error.message);
      }
    }
  }

  private pendingUploadKey(uploadId: string) {
    return `files:upload:pending:${uploadId}`;
  }

  private async getUploaderProfile(userId: string): Promise<UploaderProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
      },
    });

    return this.serializeUploaderProfile(user);
  }

  private serializeUploaderProfile(user?: { id: string; fullName: string; email: string | null; avatarUrl: string | null } | null): UploaderProfile | null {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      avatar: user.avatarUrl,
    };
  }

  private async ensureTaskBelongsToProject(userId: string, taskId: string | undefined, projectId: string) {
    if (!taskId) {
      return;
    }

    const task = await this.ensureTaskAccess(userId, taskId);
    if (task.projectId !== projectId) {
      throw new BadRequestException('Task does not belong to the provided project');
    }
  }

  private async ensureProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ createdBy: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });

    if (!project) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async ensureTaskAccess(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [{ createdBy: userId }, { members: { some: { userId } } }],
        },
      },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }
}
