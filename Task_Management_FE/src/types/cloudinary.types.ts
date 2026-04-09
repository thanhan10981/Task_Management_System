export interface CloudinaryUploadResult {
  publicId: string
  url: string
  secureUrl: string
  format: string
  resourceType: string
  bytes: number
  width?: number
  height?: number
  folder?: string
  originalFilename: string
}

export interface SaveFileMetadataPayload {
  fileName: string
  secureUrl: string
  publicId: string
  projectId: string
  format?: string
  resourceType?: string
  folderPath?: string
  sizeBytes?: number
  taskId?: string
  commentId?: string
}

export interface SharedMember {
  id: string
  name: string
  avatar?: string | null
  email?: string | null
}

export interface CloudinaryFileMetadata {
  id: string | null
  fileName: string
  publicId: string
  format: string
  resourceType: string
  bytes: number
  secureUrl: string
  createdAt: string | null
  /** Folder path as stored in DB / Cloudinary (e.g. "tasks/attachments") */
  folderPath?: string | null
  uploadedBy?: string | null
  isSaved?: boolean
  canSaveToProject?: boolean
  projectId?: string | null
  /** List of users this file is shared with */
  shared_with?: SharedMember[] | null
}

export interface CloudinaryFolderMetadata {
  name: string
  path: string
  fileCount: number
}

export interface UploadProgressEvent {
  loaded: number
  total: number
  percentage: number
}
