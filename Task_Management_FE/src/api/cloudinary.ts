import { env } from '@/constants/env'
import type {
  CloudinaryFileMetadata,
  CloudinaryFolderMetadata,
  CloudinaryUploadResult,
  SaveFileMetadataPayload,
  UploadProgressEvent,
} from '@/types/cloudinary.types'
import apiClient from './client'
import { del, get, post } from './client'

export type {
  CloudinaryFileMetadata,
  CloudinaryFolderMetadata,
  CloudinaryUploadResult,
  SaveFileMetadataPayload,
  UploadProgressEvent,
} from '@/types/cloudinary.types'

interface UploadToCloudinaryOptions {
  publicId?: string
  overwrite?: boolean
}

interface ApiEnvelope<T> {
  data?: T
}

interface SignedFileAccessPayload {
  id: string
  previewUrl?: string
  downloadUrl?: string
  fileName?: string
  expiresInSeconds?: number
  resourceType?: string
  format?: string
}

export interface SignedDownloadAccess {
  downloadUrl: string
  fileName: string
}

interface BackendUploadResponse {
  id: string
  originalFilename: string
  publicId: string
  resourceType: string
  format: string
  projectId: string
  taskId?: string
  secureUrl: string
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false
  }
  const response = (error as { response?: { status?: number } }).response
  return response?.status === 404
}

function extractFilesFromPayload(payload: unknown): CloudinaryFileMetadata[] | null {
  if (!payload || typeof payload !== 'object') return null

  const directFiles = (payload as { files?: unknown }).files
  if (Array.isArray(directFiles)) return directFiles as CloudinaryFileMetadata[]

  const directResources = (payload as { resources?: unknown }).resources
  if (Array.isArray(directResources)) return directResources as CloudinaryFileMetadata[]

  const nestedData = (payload as { data?: unknown }).data
  if (nestedData && typeof nestedData === 'object') {
    const nestedFiles = (nestedData as { files?: unknown }).files
    if (Array.isArray(nestedFiles)) return nestedFiles as CloudinaryFileMetadata[]

    const nestedResources = (nestedData as { resources?: unknown }).resources
    if (Array.isArray(nestedResources)) return nestedResources as CloudinaryFileMetadata[]
  }

  return null
}

export function normalizeFolderPath(path?: string | null): string {
  return (path ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase()
}

export function buildProjectScopedFolderPath(projectId: string, folderPath?: string | null): string {
  const normalizedFolderPath = normalizeFolderPath(folderPath)
  return normalizedFolderPath ? `projects/${projectId}/${normalizedFolderPath}` : `projects/${projectId}`
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }

  return response as T
}

function ensureCloudinaryEnv() {
  if (!env.VITE_CLOUDINARY_CLOUD_NAME) {
    throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME')
  }

  if (!env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Missing VITE_CLOUDINARY_UPLOAD_PRESET')
  }

  if (!env.VITE_CLOUDINARY_UPLOAD_URL) {
    throw new Error('Missing VITE_CLOUDINARY_UPLOAD_URL')
  }
}

export async function uploadToCloudinary(
  file: File,
  folder = '',
  onProgress?: (event: UploadProgressEvent) => void,
  options?: UploadToCloudinaryOptions
): Promise<CloudinaryUploadResult> {
  ensureCloudinaryEnv()

  const normalizedFolder = normalizeFolderPath(folder)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', env.VITE_CLOUDINARY_UPLOAD_PRESET)
  if (normalizedFolder) {
    formData.append('folder', normalizedFolder)
  }
  if (options?.publicId?.trim()) {
    formData.append('public_id', options.publicId.trim())
  }
  if (typeof options?.overwrite === 'boolean') {
    formData.append('overwrite', String(options.overwrite))
  }

  const uploadUrl = `${env.VITE_CLOUDINARY_UPLOAD_URL}/${env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl)

    if (onProgress) {
      xhr.upload.addEventListener('loadstart', () => {
        onProgress({ loaded: 0, total: file.size || 1, percentage: 1 })
      })

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          })
        } else {
          onProgress({
            loaded: 0,
            total: file.size || 1,
            percentage: 25,
          })
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (onProgress && xhr.status >= 200 && xhr.status < 300) {
        onProgress({ loaded: file.size || 1, total: file.size || 1, percentage: 100 })
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({
            publicId: data.public_id,
            url: data.url,
            secureUrl: data.secure_url,
            format: data.format,
            resourceType: data.resource_type,
            bytes: data.bytes,
            width: data.width,
            height: data.height,
            folder: data.folder,
            originalFilename: data.original_filename,
          })
        } catch {
          reject(new Error(`Failed to parse Cloudinary response (status ${xhr.status})`))
        }
      } else {
        const responsePreview = xhr.responseText?.slice(0, 300) || ''
        try {
          const errData = JSON.parse(xhr.responseText)
          const message = errData?.error?.message ?? errData?.message ?? 'Upload failed'
          reject(new Error(`Cloudinary upload failed (${xhr.status}): ${message}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}. Response: ${responsePreview}`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during Cloudinary upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.send(formData)
  })
}

export async function createCloudinaryFolder(projectId: string, folderPath: string): Promise<void> {
  const normalizedFolderPath = normalizeFolderPath(folderPath)
  if (!normalizedFolderPath) {
    throw new Error('Folder path is required')
  }

  await post('/files/cloudinary/folders', {
    projectId,
    path: normalizedFolderPath,
  })
}

export async function saveUploadedFileMetadata(payload: SaveFileMetadataPayload): Promise<void> {
  await post('/files', payload)
}

export async function uploadProjectFileToBackend(
  projectId: string,
  file: File,
  options?: { taskId?: string; folderPath?: string },
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('projectId', projectId)
  if (options?.taskId) {
    formData.append('taskId', options.taskId)
  }

  const normalizedFolderPath = normalizeFolderPath(options?.folderPath)
  if (normalizedFolderPath) {
    formData.append('folderPath', normalizedFolderPath)
  }
  formData.append('file', file)

  let response
  try {
    response = await apiClient.post<BackendUploadResponse | ApiEnvelope<BackendUploadResponse>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    })
  } catch (error) {
    if (isAxiosTimeoutError(error)) {
      throw new Error('Upload request timed out. File may still be uploaded. Refreshing list...')
    }

    throw error
  }

  const payload = unwrapApiPayload(response.data)

  return {
    id: payload.id,
    publicId: payload.publicId,
    url: payload.secureUrl,
    secureUrl: payload.secureUrl,
    format: payload.format,
    resourceType: payload.resourceType,
    bytes: file.size,
    folder: payload.publicId.split('/').slice(0, -1).join('/'),
    originalFilename: payload.originalFilename,
  }
}

function isAxiosTimeoutError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const payload = error as { code?: string; message?: string }
  return payload.code === 'ECONNABORTED' || payload.message?.toLowerCase().includes('timeout') === true
}

export async function getUploadedFileMetadata(
  projectId: string,
  folderPath?: string,
  includeDescendants = true,
): Promise<CloudinaryFileMetadata[]> {
  const normalizedFolderPath = normalizeFolderPath(folderPath)
  const params = {
    projectId,
    folderPath: normalizedFolderPath,
    includeDescendants: includeDescendants ? 'true' : 'false',
  }

  console.log('[CloudinaryAPI] Calling getUploadedFileMetadata', {
    baseURL: env.VITE_API_BASE_URL,
    endpoint: '/files/cloudinary/resources',
    projectId,
    folderPath: normalizedFolderPath,
    includeDescendants,
  })

  try {
    const response = await get<unknown>('/files/cloudinary/resources', { params })
    const payload = unwrapApiPayload(response as ApiEnvelope<unknown> | unknown)
    const files = extractFilesFromPayload(payload)

    if (!files) {
      console.error('[CloudinaryAPI] Invalid files response payload', { payload })
      throw new Error('Invalid response format for files metadata')
    }

    return files
  } catch (error) {
    const notFound = isNotFoundError(error)
    console.warn('[CloudinaryAPI] getUploadedFileMetadata failed', {
      notFound,
      error,
    })

    if (notFound) {
      return []
    }

    throw error instanceof Error ? error : new Error('Cannot load files metadata')
  }
}

export async function getTaskFileMetadata(
  projectId: string,
  taskId: string,
): Promise<CloudinaryFileMetadata[]> {
  const response = await get<unknown>('/files', {
    params: {
      projectId,
      taskId,
    },
  })
  const payload = unwrapApiPayload(response as ApiEnvelope<unknown> | unknown)
  const files = extractFilesFromPayload(payload)

  if (!files) {
    throw new Error('Invalid response format for task files')
  }

  return files
}

export async function getFolderMetadata(projectId: string): Promise<CloudinaryFolderMetadata[]> {
  console.log('[CloudinaryAPI] Calling getFolderMetadata', {
    baseURL: env.VITE_API_BASE_URL,
    endpoint: '/files/cloudinary/folders',
    params: { projectId, recursive: true },
  })

  const response = await get<
    { folders: CloudinaryFolderMetadata[] } | { data: { folders: CloudinaryFolderMetadata[] } }
  >('/files/cloudinary/folders', {
    params: { projectId, recursive: true },
  })

  const payload = unwrapApiPayload(response)
  if (!payload || !Array.isArray(payload.folders)) {
    console.error('[CloudinaryAPI] Invalid folders response payload', payload)
    throw new Error('Invalid response format for folders metadata')
  }

  console.log('[CloudinaryAPI] getFolderMetadata result', {
    count: payload.folders.length,
  })

  return (payload.folders ?? []).map((folder) => ({
    ...folder,
    fileCount: typeof folder.fileCount === 'number' ? folder.fileCount : 0,
  }))
}

export async function deleteFileMetadata(fileId: string): Promise<void> {
  await del(`/files/${fileId}`)
}

export async function getFilePreviewUrl(fileId: string): Promise<string> {
  const response = await get<SignedFileAccessPayload | ApiEnvelope<SignedFileAccessPayload>>(`/files/${fileId}/view`)
  const payload = unwrapApiPayload(response)

  if (!payload?.previewUrl) {
    throw new Error('Preview URL is missing from server response')
  }

  return payload.previewUrl
}

export async function getFileDownloadUrl(fileId: string): Promise<SignedDownloadAccess> {
  const response = await get<SignedFileAccessPayload | ApiEnvelope<SignedFileAccessPayload>>(`/files/${fileId}/download`)
  const payload = unwrapApiPayload(response)

  if (!payload?.downloadUrl) {
    throw new Error('Download URL is missing from server response')
  }

  return {
    downloadUrl: payload.downloadUrl,
    fileName: payload.fileName || 'file',
  }
}
