import type {
  CloudinaryFileMetadata,
  CloudinaryFolderMetadata,
  CloudinaryUploadResult,
} from '@/types/cloudinary.types'

export type UploadQueueStatus =
  | 'uploading'
  | 'cloudinary-success'
  | 'saving-metadata'
  | 'success'
  | 'error'

export interface UploadQueueItem {
  id: string
  file: File
  status: UploadQueueStatus
  progress: number
  result?: CloudinaryUploadResult
  error?: string
}

export type CloudinaryFile = CloudinaryFileMetadata

export type CloudinaryFolder = CloudinaryFolderMetadata
