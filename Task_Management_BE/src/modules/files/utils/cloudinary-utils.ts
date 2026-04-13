import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  CloudinaryResourcePayload,
  CloudinaryRootFoldersApi,
  CloudinaryResourceType,
} from '../types/cloudinary.types';
import { FOLDER_MARKER_SUFFIXES } from '../constants/cloudinary.constants';

export function configureCloudinary(configService: ConfigService): boolean {
  const cloudName = configService.get<string>('cloudinary.cloudName') ?? process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = configService.get<string>('cloudinary.apiKey') ?? process.env.CLOUDINARY_API_KEY;
  const apiSecret = configService.get<string>('cloudinary.apiSecret') ?? process.env.CLOUDINARY_API_SECRET;

  const hasCredentials = Boolean(cloudName && apiKey && apiSecret);

  if (hasCredentials) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return hasCredentials;
}

export function normalizePath(path?: string | null): string | undefined {
  const normalized = path?.trim().replace(/^\/+|\/+$/g, '');
  return normalized || undefined;
}

export function escapeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const payload = error as { http_code?: number };
  return payload.http_code === 404;
}

export function isAlreadyExistsError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const payload = error as { http_code?: number; message?: string };
  if (payload.http_code !== 409) {
    return false;
  }

  return typeof payload.message === 'string' && payload.message.toLowerCase().includes('already');
}

export function deriveFolderFromPublicId(publicId: string, parentPath?: string): string {
  const segments = publicId.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return '';
  }

  if (!parentPath) {
    return segments[0] ?? '';
  }

  const parentSegments = parentPath.split('/').filter(Boolean);

  const isUnderParent = parentSegments.every((segment, index) => segments[index] === segment);
  if (!isUnderParent) {
    return '';
  }

  if (segments.length <= parentSegments.length + 1) {
    return '';
  }

  return [...parentSegments, segments[parentSegments.length]].join('/');
}

export function isFolderMarkerResource(publicId: string): boolean {
  return FOLDER_MARKER_SUFFIXES.some((suffix) => publicId.endsWith(suffix));
}

export function mapCloudinaryResource(resource: CloudinaryResourcePayload): CloudinaryResourcePayload {
  return {
    public_id: resource.public_id,
    secure_url: resource.secure_url,
    format: resource.format,
    resource_type: resource.resource_type,
    bytes: resource.bytes,
    created_at: resource.created_at,
    asset_folder: resource.asset_folder,
  };
}

export function toResourceType(resourceType?: string): CloudinaryResourceType | null {
  if (resourceType === 'image' || resourceType === 'video' || resourceType === 'raw') {
    return resourceType;
  }
  return null;
}

export function hasRootFoldersApi(api: unknown): api is CloudinaryRootFoldersApi {
  return typeof (api as CloudinaryRootFoldersApi)?.root_folders === 'function';
}
