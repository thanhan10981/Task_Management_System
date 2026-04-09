import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateFileRecordDto } from '../dto/create-file-record.dto';
import { CloudinaryAdminService } from './cloudinary-admin.service';

interface ListCloudinaryResourcesParams {
  projectId: string;
  folderPath?: string;
  includeDescendants?: boolean;
}

interface CreateCloudinaryFolderParams {
  projectId: string;
  path: string;
}

const PROJECT_FOLDER_PREFIX = 'project';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryAdminService: CloudinaryAdminService,
  ) {}

  async create(userId: string, dto: CreateFileRecordDto) {
    const normalizedFolderPath = this.resolveLogicalFolderPath(dto.projectId, dto.folderPath, dto.publicId);

    await this.ensureProjectAccess(userId, dto.projectId);

    if (dto.taskId) {
      const task = await this.ensureTaskAccess(userId, dto.taskId);
      if (task.projectId !== dto.projectId) {
        throw new BadRequestException('Task does not belong to the provided project');
      }
    }

    const cloudinaryAsset = await this.cloudinaryAdminService.getResource(dto.publicId, dto.resourceType);

    if (!cloudinaryAsset) {
      throw new BadRequestException('Cloudinary asset does not exist or is not accessible');
    }

    const file = await this.prisma.file.create({
      data: {
        fileName: dto.fileName || this.extractFileName(dto.publicId),
        fileUrl: cloudinaryAsset.secure_url ?? dto.secureUrl,
        fileType: cloudinaryAsset.format ?? dto.format,
        fileCategory: cloudinaryAsset.resource_type ?? dto.resourceType,
        storageKey: dto.publicId,
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
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        storageKey: true,
        fileType: true,
        fileCategory: true,
        folderPath: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return {
      id: file.id,
      fileName: file.fileName,
      secureUrl: file.fileUrl,
      publicId: file.storageKey,
      format: file.fileType,
      resourceType: file.fileCategory,
      folderPath: file.folderPath,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : 0,
      createdAt: file.createdAt,
      uploadedBy: userId,
      canSaveToProject: true,
    };
  }

  async list(userId: string, projectId: string, folderPath?: string) {
    await this.ensureProjectAccess(userId, projectId);

    const normalizedFolderPath = this.normalizePath(folderPath);

    const files = await this.prisma.file.findMany({
      where: {
        projectId,
        isDeleted: false,
        ...(normalizedFolderPath ? { folderPath: normalizedFolderPath } : {}),
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
      },
    });

    return {
      files: files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        secureUrl: file.fileUrl,
        publicId: file.storageKey ?? file.id,
        format: file.fileType ?? '',
        resourceType: file.fileCategory ?? 'raw',
        bytes: file.sizeBytes ? Number(file.sizeBytes) : 0,
        createdAt: file.createdAt,
        uploadedBy: file.uploadedBy,
        isSaved: true,
        canSaveToProject: true,
      })),
    };
  }

  async listCloudinaryFolders(userId: string, projectId: string, parentPath?: string, recursive = false) {
    await this.ensureProjectAccess(userId, projectId);

    const normalizedParentPath = this.normalizePath(parentPath);
    const scopedParentPath = this.toScopedFolderPath(projectId, normalizedParentPath);

    const mergedPaths = new Set<string>();
    const cloudinaryFolders = recursive
      ? await this.cloudinaryAdminService.listFoldersRecursive(scopedParentPath)
      : await this.cloudinaryAdminService.listFolders(scopedParentPath);

    for (const cloudFolder of cloudinaryFolders) {
      const logicalPath = this.toLogicalFolderPath(projectId, cloudFolder.path);
      if (!logicalPath) {
        continue;
      }

      if (recursive) {
        const descendantPath = this.deriveDescendantPath(logicalPath, normalizedParentPath);
        if (descendantPath) {
          mergedPaths.add(descendantPath);
        }
      } else {
        const directChild = this.deriveDirectChildPath(logicalPath, normalizedParentPath);
        if (directChild) {
          mergedPaths.add(directChild);
        }
      }
    }

    // Backward compatibility: include legacy folders discovered from DB records.
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
        const descendantPath = this.deriveDescendantPath(dbFolder.folderPath, normalizedParentPath);
        if (descendantPath) {
          mergedPaths.add(descendantPath);
        }
      } else {
        const directChild = this.deriveDirectChildPath(dbFolder.folderPath, normalizedParentPath);
        if (directChild) {
          mergedPaths.add(directChild);
        }
      }
    }

    const countByPath = new Map<string, number>();

    const folderPaths = [...mergedPaths];
    await Promise.all(
      folderPaths.map(async (path) => {
        const fileCount = await this.prisma.file.count({
          where: {
            projectId,
            isDeleted: false,
            folderPath: path,
          },
        });

        countByPath.set(path, fileCount);
      }),
    );

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

    const normalizedFolderPath = this.normalizePath(params.folderPath);
    const includeDescendants = params.includeDescendants ?? true;
    const savedFiles = await this.prisma.file.findMany({
      where: {
        isDeleted: false,
        projectId: params.projectId,
        ...(normalizedFolderPath
          ? includeDescendants
            ? {
                OR: [
                  { folderPath: normalizedFolderPath },
                  { folderPath: { startsWith: `${normalizedFolderPath}/` } },
                ],
              }
            : { folderPath: normalizedFolderPath }
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
        fileName: savedFile.fileName ?? this.extractFileName(savedFile.storageKey ?? ''),
        publicId: savedFile.storageKey ?? '',
        format: savedFile.fileType ?? '',
        resourceType: savedFile.fileCategory ?? 'raw',
        bytes: savedFile.sizeBytes ? Number(savedFile.sizeBytes) : 0,
        secureUrl: savedFile.fileUrl ?? '',
        createdAt: savedFile.createdAt ?? null,
        uploadedBy: savedFile.uploadedBy ?? null,
        isSaved: true,
        canSaveToProject: true,
        projectId: savedFile.projectId,
        folderPath: this.normalizePath(savedFile.folderPath) ?? '',
      })),
      requestedBy: userId,
    };
  }

  async createCloudinaryFolder(userId: string, params: CreateCloudinaryFolderParams) {
    await this.ensureProjectAccess(userId, params.projectId);

    const normalizedPath = this.normalizePath(params.path);

    if (!normalizedPath) {
      throw new BadRequestException('Folder path is required');
    }

    const scopedFolderPath = this.toScopedFolderPath(params.projectId, normalizedPath);
    const folder = await this.cloudinaryAdminService.createFolder(scopedFolderPath);

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
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        uploadedBy: true,
        isDeleted: true,
        storageKey: true,
        fileCategory: true,
        projectId: true,
      },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException('File not found');
    }

    await this.ensureProjectAccess(userId, file.projectId);

    if (file.uploadedBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    if (file.storageKey) {
      await this.cloudinaryAdminService.deleteAsset(file.storageKey, file.fileCategory ?? 'image');
    }

    await this.prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    return { message: 'File deleted from Cloudinary and database' };
  }

  private extractFileName(publicId: string) {
    return publicId.split('/').pop() ?? publicId;
  }

  private extractFolderPath(publicId: string) {
    const segments = publicId.split('/').filter(Boolean);
    if (segments.length <= 1) {
      return '';
    }

    return segments.slice(0, -1).join('/');
  }

  private isFolderMarkerResource(publicId: string) {
    return publicId.endsWith('/.folder-marker') || publicId.endsWith('/.folder-marker.txt');
  }

  private normalizePath(path?: string | null) {
    const normalized = path?.trim().replace(/^\/+|\/+$/g, '');
    return normalized || undefined;
  }

  private getProjectRootFolder(projectId: string) {
    return `${PROJECT_FOLDER_PREFIX}-${projectId}`;
  }

  private toScopedFolderPath(projectId: string, logicalFolderPath?: string) {
    const root = this.getProjectRootFolder(projectId);
    const normalizedLogicalPath = this.normalizePath(logicalFolderPath);
    return normalizedLogicalPath ? `${root}/${normalizedLogicalPath}` : root;
  }

  private toLogicalFolderPath(projectId: string, folderPath?: string | null) {
    const normalizedPath = this.normalizePath(folderPath);
    if (!normalizedPath) {
      return '';
    }

    const root = this.getProjectRootFolder(projectId);
    if (normalizedPath === root) {
      return '';
    }

    if (normalizedPath.startsWith(`${root}/`)) {
      return normalizedPath.slice(root.length + 1);
    }

    return normalizedPath;
  }

  private resolveLogicalFolderPath(projectId: string, folderPath?: string | null, publicId?: string | null) {
    const normalizedFolderPath = this.normalizePath(folderPath);
    if (normalizedFolderPath) {
      return this.toLogicalFolderPath(projectId, normalizedFolderPath);
    }

    if (!publicId) {
      return undefined;
    }

    const extracted = this.extractFolderPath(publicId);
    const logicalPath = this.toLogicalFolderPath(projectId, extracted);
    return this.normalizePath(logicalPath);
  }

  private deriveDirectChildPath(path: string | null | undefined, parentPath?: string) {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      return '';
    }

    const segments = normalizedPath.split('/').filter(Boolean);
    if (!segments.length) {
      return '';
    }

    if (!parentPath) {
      return segments[0] ?? '';
    }

    const parentSegments = parentPath.split('/').filter(Boolean);
    const isUnderParent = parentSegments.every((segment, index) => segments[index] === segment);
    if (!isUnderParent || segments.length <= parentSegments.length) {
      return '';
    }

    return [...parentSegments, segments[parentSegments.length]].join('/');
  }

  private deriveDescendantPath(path: string | null | undefined, parentPath?: string) {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      return '';
    }

    if (!parentPath) {
      return normalizedPath;
    }

    const parentSegments = parentPath.split('/').filter(Boolean);
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    const isUnderParent = parentSegments.every((segment, index) => pathSegments[index] === segment);

    return isUnderParent ? normalizedPath : '';
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
