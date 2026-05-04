import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateFileRecordDto } from '../dto/create-file-record.dto';
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

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesRepository: FilesRepository,
    private readonly cloudinaryFileManagerService: CloudinaryFileManagerService,
  ) {}

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
        folderPath: true,
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
        taskId: file.taskId,
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
        fileUrl: true,
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
        isSaved: true,
        canSaveToProject: true,
        projectId: savedFile.projectId,
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
