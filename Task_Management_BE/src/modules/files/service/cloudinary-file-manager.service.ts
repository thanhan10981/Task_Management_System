import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryAccessHelper } from '../utils/cloudinary-access.helper';
import { CloudinaryAdminService } from './cloudinary-admin.service';

const CLOUDINARY_PROJECTS_ROOT = 'projects';
const LEGACY_PROJECT_FOLDER_PREFIX = 'project';
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi']);
const RAW_DOCUMENT_EXTENSIONS = new Set([
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'zip',
  'rar',
  '7z',
]);

type AllowedResourceType = 'image' | 'video' | 'raw';

@Injectable()
export class CloudinaryFileManagerService {
  constructor(
    private readonly cloudinaryAccessHelper: CloudinaryAccessHelper,
    private readonly cloudinaryAdminService: CloudinaryAdminService,
  ) {}

  async getResource(publicId: string, resourceType?: string) {
    return this.cloudinaryAdminService.getResource(publicId, resourceType);
  }

  async uploadProjectTaskFile(input: {
    fileBuffer: Buffer;
    originalFilename: string;
    mimeType: string;
    projectId: string;
    folderPath?: string;
  }) {
    return this.cloudinaryAccessHelper.uploadProjectTaskFile(input);
  }

  getDefaultAuthenticatedUrlTtlSeconds() {
    return this.cloudinaryAccessHelper.getDefaultAuthenticatedUrlTtlSeconds();
  }

  async createPreviewUrl(input: {
    publicId: string;
    resourceType: AllowedResourceType;
    format?: string;
    expiresInSeconds: number;
  }) {
    return this.cloudinaryAccessHelper.createPreviewUrl(input);
  }

  async createDownloadUrl(input: {
    publicId: string;
    resourceType: AllowedResourceType;
    format?: string;
    fileName?: string;
    expiresInSeconds: number;
  }) {
    return this.cloudinaryAccessHelper.createDownloadUrl(input);
  }

  async createFolder(folderPath: string) {
    return this.cloudinaryAdminService.createFolder(folderPath);
  }

  async listFolders(scopedParentPath?: string, recursive = false) {
    return recursive
      ? this.cloudinaryAdminService.listFoldersRecursive(scopedParentPath)
      : this.cloudinaryAdminService.listFolders(scopedParentPath);
  }

  async deleteAsset(publicId: string, resourceType: AllowedResourceType) {
    return this.cloudinaryAdminService.deleteAsset(publicId, resourceType);
  }

  extractFileName(publicId: string) {
    return publicId.split('/').pop() ?? publicId;
  }

  extractFileExtension(value?: string | null) {
    if (!value) {
      return undefined;
    }

    const cleanValue = value.split('?')[0] ?? value;
    const segment = cleanValue.split('/').pop() ?? cleanValue;
    const extension = segment.includes('.') ? segment.split('.').pop() : undefined;
    const normalized = extension?.trim().toLowerCase();
    return normalized || undefined;
  }

  normalizePath(path?: string | null) {
    const normalized = path?.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
    return normalized || undefined;
  }

  toScopedFolderPath(projectId: string, logicalFolderPath?: string) {
    const root = this.getProjectRootFolder(projectId);
    const normalizedLogicalPath = this.normalizePath(logicalFolderPath);
    return normalizedLogicalPath ? `${root}/${normalizedLogicalPath}` : root;
  }

  toLogicalFolderPath(projectId: string, folderPath?: string | null) {
    const normalizedPath = this.normalizePath(folderPath);
    if (!normalizedPath) {
      return '';
    }

    const root = this.getProjectRootFolder(projectId);
    const legacyRoot = this.getLegacyProjectRootFolder(projectId);
    if (normalizedPath === root || normalizedPath === legacyRoot) {
      return '';
    }

    if (normalizedPath.startsWith(`${root}/`)) {
      return normalizedPath.slice(root.length + 1);
    }

    if (normalizedPath.startsWith(`${legacyRoot}/`)) {
      return normalizedPath.slice(legacyRoot.length + 1);
    }

    return normalizedPath;
  }

  resolveLogicalFolderPath(projectId: string, folderPath?: string | null, publicId?: string | null) {
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

  deriveDirectChildPath(path: string | null | undefined, parentPath?: string) {
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

  deriveDescendantPath(path: string | null | undefined, parentPath?: string) {
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

  toAllowedResourceType(resourceType?: string | null): AllowedResourceType {
    if (resourceType === 'video') {
      return 'video';
    }

    if (resourceType === 'raw') {
      return 'raw';
    }

    return 'image';
  }

  normalizeStoredResourceType(
    fileCategory?: string | null,
    fileName?: string | null,
    fileType?: string | null,
  ): AllowedResourceType {
    const normalizedCategory = (fileCategory ?? '').trim().toLowerCase();
    if (normalizedCategory === 'image' || normalizedCategory === 'video' || normalizedCategory === 'raw') {
      return normalizedCategory;
    }

    const extension = this.extractFileExtension(fileType) ?? this.extractFileExtension(fileName);
    if (!extension) {
      return 'raw';
    }

    if (extension === 'pdf' || IMAGE_EXTENSIONS.has(extension)) {
      return 'image';
    }

    if (VIDEO_EXTENSIONS.has(extension)) {
      return 'video';
    }

    return 'raw';
  }

  normalizeStoredFormat(fileType?: string | null, fileName?: string | null, storageKey?: string | null): string | undefined {
    const rawFormat = (fileType ?? '').trim().toLowerCase();
    if (rawFormat) {
      return rawFormat;
    }

    return this.extractFileExtension(fileName) ?? this.extractFileExtension(storageKey);
  }

  resolveDownloadFormat(
    fileName: string | null | undefined,
    fileType: string | null | undefined,
    resourceType: AllowedResourceType,
    storageKey: string | null | undefined,
  ) {
    const normalizedFileType = fileType?.toLowerCase();
    if (normalizedFileType) {
      return normalizedFileType;
    }

    const extensionFromName = this.extractFileExtension(fileName);
    if (extensionFromName) {
      return extensionFromName;
    }

    const extensionFromStorageKey = this.extractFileExtension(storageKey);
    if (extensionFromStorageKey) {
      return extensionFromStorageKey;
    }

    if (resourceType === 'raw') {
      return 'bin';
    }

    return undefined;
  }

  resolveDownloadFileName(
    fileName: string | null | undefined,
    format: string | undefined,
    storageKey: string | null | undefined,
  ) {
    const baseName = this.extractFileName(fileName || '') || this.extractFileName(storageKey || '') || 'file';
    const normalizedFormat = format?.trim().toLowerCase();

    if (!normalizedFormat) {
      return baseName;
    }

    if (baseName.toLowerCase().endsWith(`.${normalizedFormat}`)) {
      return baseName;
    }

    return `${baseName}.${normalizedFormat}`;
  }

  detectPreviewOptions(
    fileName?: string | null,
    fileType?: string | null,
    fileCategory?: string | null,
    storageKey?: string | null,
  ): { canPreview: boolean; resourceType: AllowedResourceType; format?: string } {
    const normalizedFileType = this.extractFileExtension(fileType);
    const extension = this.extractFileExtension(fileName) ?? this.extractFileExtension(storageKey);
    const inferredType = normalizedFileType || extension || '';
    const normalizedCategory = this.toAllowedResourceType(fileCategory);

    const isPdf = inferredType === 'pdf';
    const isImage = IMAGE_EXTENSIONS.has(inferredType);
    const isVideo = VIDEO_EXTENSIONS.has(inferredType);

    if (isPdf) {
      return {
        canPreview: true,
        resourceType: 'image',
        format: 'pdf',
      };
    }

    if (isImage) {
      return {
        canPreview: true,
        resourceType: 'image',
      };
    }

    if (isVideo || normalizedCategory === 'video') {
      return {
        canPreview: true,
        resourceType: 'video',
      };
    }

    if (RAW_DOCUMENT_EXTENSIONS.has(inferredType) || normalizedCategory === 'raw') {
      return {
        canPreview: false,
        resourceType: 'raw',
      };
    }

    return {
      canPreview: false,
      resourceType: 'raw',
    };
  }

  ensureFolderPath(path?: string | null) {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      throw new BadRequestException('Folder path is required');
    }

    return normalizedPath;
  }

  private extractFolderPath(publicId: string) {
    const segments = publicId.split('/').filter(Boolean);
    if (segments.length <= 1) {
      return '';
    }

    return segments.slice(0, -1).join('/');
  }

  private getProjectRootFolder(projectId: string) {
    return `${CLOUDINARY_PROJECTS_ROOT}/${projectId}`;
  }

  private getLegacyProjectRootFolder(projectId: string) {
    return `${LEGACY_PROJECT_FOLDER_PREFIX}-${projectId}`;
  }
}
