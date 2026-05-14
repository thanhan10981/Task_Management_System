import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from './cloudinary-utils';

interface UploadProjectTaskFileParams {
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  projectId: string;
  folderPath?: string;
}

interface UploadProfileImageParams {
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  userId: string;
  kind: 'avatar' | 'cover';
}

interface CreateSignedUrlParams {
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  format?: string;
  fileName?: string;
  expiresInSeconds?: number;
}

interface CreateSignedUploadParams {
  originalFilename: string;
  mimeType: string;
  projectId: string;
  folderPath?: string;
}

export interface SignedUploadParams {
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
  uploadParams: Record<string, string | number | boolean>;
  resourceType: 'image' | 'video' | 'raw';
  folder: string;
  expiresAt: number;
}

@Injectable()
export class CloudinaryAccessHelper {
  private readonly hasCredentials: boolean;
  private readonly defaultAuthenticatedUrlTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.hasCredentials = configureCloudinary(this.configService);
    this.defaultAuthenticatedUrlTtlSeconds = this.resolveDefaultAuthenticatedUrlTtlSeconds();
  }

  async uploadProjectTaskFile(params: UploadProjectTaskFileParams): Promise<UploadApiResponse> {
    this.ensureConfigured();

    const fileKind = this.resolveSupportedFileKind(params.originalFilename, params.mimeType);
    const normalizedLogicalPath = this.normalizeFolderPath(params.folderPath) || 'tasks';
    const targetFolder = `projects/${params.projectId}/${normalizedLogicalPath}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: fileKind.resourceType,
          type: 'authenticated',
          folder: targetFolder,
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          format: fileKind.enforcedFormat,
        },
        (error, result) => {
          if (error || !result) {
            reject(new InternalServerErrorException('Failed to upload file to Cloudinary'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(params.fileBuffer);
    });
  }

  async uploadProfileImage(params: UploadProfileImageParams): Promise<UploadApiResponse> {
    this.ensureConfigured();

    const fileKind = this.resolveSupportedFileKind(params.originalFilename, params.mimeType);
    if (fileKind.resourceType !== 'image') {
      throw new InternalServerErrorException('Profile image upload requires an image file');
    }

    const targetFolder = `users/${params.userId}/${params.kind}s`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          type: 'upload',
          folder: targetFolder,
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(new InternalServerErrorException('Failed to upload profile image to Cloudinary'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(params.fileBuffer);
    });
  }

  async createPreviewUrl(params: CreateSignedUrlParams): Promise<string> {
    this.ensureConfigured();

    if (params.resourceType === 'video') {
      return cloudinary.url(params.publicId, {
        secure: true,
        resource_type: 'video',
        type: 'authenticated',
        sign_url: true,
      });
    }

    const expiresAt = this.toExpiresAt(params.expiresInSeconds ?? this.defaultAuthenticatedUrlTtlSeconds);

    return cloudinary.utils.private_download_url(params.publicId, params.format ?? 'pdf', {
      resource_type: params.resourceType,
      type: 'authenticated',
      expires_at: expiresAt,
      attachment: false,
    });
  }

  async createDownloadUrl(params: CreateSignedUrlParams): Promise<string> {
    this.ensureConfigured();

    const expiresAt = this.toExpiresAt(params.expiresInSeconds ?? this.defaultAuthenticatedUrlTtlSeconds);
    const attachmentName = this.resolveAttachmentFilename(params.fileName, params.publicId, params.format);
    const downloadOptions = {
      resource_type: params.resourceType,
      type: 'authenticated' as const,
      expires_at: expiresAt,
      attachment: attachmentName as unknown as boolean,
    };

    return cloudinary.utils.private_download_url(params.publicId, params.format, downloadOptions);
  }

  getDefaultAuthenticatedUrlTtlSeconds(): number {
    return this.defaultAuthenticatedUrlTtlSeconds;
  }

  createSignedUploadParams(params: CreateSignedUploadParams): SignedUploadParams {
    this.ensureConfigured();

    const fileKind = this.resolveSupportedFileKind(params.originalFilename, params.mimeType);
    const normalizedLogicalPath = this.normalizeFolderPath(params.folderPath) || 'tasks';
    const targetFolder = `projects/${params.projectId}/${normalizedLogicalPath}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 10 * 60;
    const apiKey = this.configService.get<string>('cloudinary.apiKey') ?? process.env.CLOUDINARY_API_KEY;
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret') ?? process.env.CLOUDINARY_API_SECRET;
    const cloudName = this.configService.get<string>('cloudinary.cloudName') ?? process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiKey || !apiSecret || !cloudName) {
      throw new InternalServerErrorException('Cloudinary credentials are not configured on the server');
    }

    const paramsToSign: Record<string, string | number | boolean> = {
      folder: targetFolder,
      overwrite: false,
      timestamp,
      type: 'authenticated',
      unique_filename: true,
      use_filename: false,
    };

    if (fileKind.enforcedFormat) {
      paramsToSign.format = fileKind.enforcedFormat;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      apiKey,
      cloudName,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${fileKind.resourceType}/upload`,
      uploadParams: {
        ...paramsToSign,
        api_key: apiKey,
        signature,
      },
      resourceType: fileKind.resourceType,
      folder: targetFolder,
      expiresAt,
    };
  }

  resolveSupportedFileKind(originalFilename: string, mimeType: string): { resourceType: 'image' | 'video' | 'raw'; enforcedFormat: 'pdf' | undefined } {
    const normalizedName = originalFilename.toLowerCase();
    const normalizedMime = mimeType.toLowerCase();

    const isPdf = normalizedName.endsWith('.pdf') || normalizedMime === 'application/pdf';
    if (isPdf) {
      return {
        resourceType: 'image',
        enforcedFormat: 'pdf',
      };
    }

    const isDocx = normalizedName.endsWith('.docx')
      || normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDocx) {
      return {
        resourceType: 'raw',
        enforcedFormat: undefined,
      };
    }

    const isImage = normalizedMime.startsWith('image/')
      || normalizedName.endsWith('.jpg')
      || normalizedName.endsWith('.jpeg')
      || normalizedName.endsWith('.png')
      || normalizedName.endsWith('.webp');

    if (isImage) {
      return {
        resourceType: 'image',
        enforcedFormat: undefined,
      };
    }

    const isVideo = normalizedMime.startsWith('video/')
      || normalizedName.endsWith('.mp4')
      || normalizedName.endsWith('.mov')
      || normalizedName.endsWith('.webm')
      || normalizedName.endsWith('.mkv')
      || normalizedName.endsWith('.avi');

    if (isVideo) {
      return {
        resourceType: 'video',
        enforcedFormat: undefined,
      };
    }

    return {
      resourceType: 'raw',
      enforcedFormat: undefined,
    };
  }

  private normalizeFolderPath(path?: string): string {
    return (path ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  }

  private resolveAttachmentFilename(fileName?: string, publicId?: string, format?: string): string {
    const candidate = this.extractLastSegment(fileName) || this.extractLastSegment(publicId) || 'file';
    const normalizedFormat = format?.trim().toLowerCase();

    if (!normalizedFormat) {
      return candidate;
    }

    const candidateLower = candidate.toLowerCase();
    if (candidateLower.endsWith(`.${normalizedFormat}`)) {
      return candidate;
    }

    return `${candidate}.${normalizedFormat}`;
  }

  private extractLastSegment(value?: string): string {
    if (!value) {
      return '';
    }

    const normalized = value.split('?')[0]?.trim() ?? '';
    if (!normalized) {
      return '';
    }

    const segment = normalized.split('/').pop()?.trim() ?? '';
    return segment;
  }

  private toExpiresAt(expiresInSeconds: number): number {
    const now = Math.floor(Date.now() / 1000);
    return now + expiresInSeconds;
  }

  private resolveDefaultAuthenticatedUrlTtlSeconds(): number {
    const configuredValue = this.configService.get<number>('cloudinary.authenticatedUrlTtlSeconds')
      ?? Number(process.env.CLOUDINARY_AUTHENTICATED_URL_TTL_SECONDS ?? 300);

    if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
      return 300;
    }

    return Math.floor(configuredValue);
  }

  private ensureConfigured() {
    if (!this.hasCredentials) {
      throw new InternalServerErrorException('Cloudinary credentials are not configured on the server');
    }
  }
}
