import { ref, type Ref } from 'vue'
import {
  deleteFileMetadata,
  getUploadedFileMetadata,
  normalizeFolderPath,
  type CloudinaryUploadResult,
} from '@/api/cloudinary'
import type { CloudinaryFile, CloudinaryFolder } from '../types/files-view.types'

interface UseFilesOptions {
  currentFolder: Ref<string>
  currentProjectId: Ref<string | null>
  folders: Ref<CloudinaryFolder[]>
  loadFolders: () => Promise<void>
  toast: {
    success: (message: string) => void
    error: (message: string) => void
  }
  errorMessage: (error: unknown, fallback: string) => string
}

export function useFiles(options: UseFilesOptions) {
  const { currentFolder, currentProjectId, folders, loadFolders, toast, errorMessage } = options

  const recentFiles = ref<CloudinaryFile[]>([])
  const allFiles = ref<CloudinaryFile[]>([])
  const loadingFiles = ref(false)
  const deletingFile = ref<string | null>(null)
  const latestFilesRequestId = ref(0)

  async function loadFiles() {
    if (!currentProjectId.value) {
      recentFiles.value = []
      return
    }

    const requestId = ++latestFilesRequestId.value
    loadingFiles.value = true
    try {
      const files = await getUploadedFileMetadata(currentProjectId.value, currentFolder.value || undefined, true)
      if (requestId === latestFilesRequestId.value) {
        recentFiles.value = files
      }
    } catch (error) {
      if (requestId === latestFilesRequestId.value) {
        recentFiles.value = []
        console.error('[FilesView] loadFiles failed', error)
        toast.error(errorMessage(error, 'Cannot load files'))
      }
    } finally {
      if (requestId === latestFilesRequestId.value) {
        loadingFiles.value = false
      }
    }
  }

  async function loadAllFiles() {
    if (!currentProjectId.value) {
      allFiles.value = []
      return
    }

    const projectId = currentProjectId.value

    try {
      const rootAllFiles = await getUploadedFileMetadata(projectId, undefined, true)
      if (rootAllFiles.length || folders.value.length === 0) {
        allFiles.value = rootAllFiles
        return
      }

      const uniqueFolderPaths = [...new Set(
        folders.value
          .map((folder) => normalizeFolderPath(folder.path))
          .filter((path) => Boolean(path)),
      )]

      const settled = await Promise.allSettled([
        getUploadedFileMetadata(projectId, '', false),
        ...uniqueFolderPaths.map((folderPath) => getUploadedFileMetadata(projectId, folderPath, false)),
      ])

      const mergedByPublicId = new Map<string, CloudinaryFile>()
      for (const result of settled) {
        if (result.status !== 'fulfilled') continue
        for (const file of result.value) {
          if (!mergedByPublicId.has(file.publicId)) {
            mergedByPublicId.set(file.publicId, file)
          }
        }
      }

      allFiles.value = [...mergedByPublicId.values()]
    } catch (error) {
      console.error('[FilesView] loadAllFiles failed', error)
    }
  }

  async function deleteFile(file: CloudinaryFile) {
    const fileId = file.id
    if (!fileId) return
    if (!confirm('Are you sure you want to delete this file?')) return

    deletingFile.value = fileId
    try {
      await deleteFileMetadata(fileId)
      toast.success('File deleted')
      await Promise.all([loadFiles(), loadAllFiles()])
    } catch (error) {
      toast.error(errorMessage(error, 'Cannot delete file'))
    } finally {
      deletingFile.value = null
    }
  }

  async function refreshAfterUpload(uploadedPublicIds: string[]) {
    if (!currentProjectId.value) {
      return false
    }

    const maxAttempts = 4
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await loadFolders()
      await Promise.all([loadFiles(), loadAllFiles()])
      const visibleUploaded = recentFiles.value.some((file) => uploadedPublicIds.includes(file.publicId))
      if (visibleUploaded) {
        return true
      }
      await new Promise((resolve) => {
        window.setTimeout(resolve, 450)
      })
    }
    return false
  }

  function mergeOptimisticUploadedFiles(results: CloudinaryUploadResult[]) {
    const existingByPublicId = new Map(recentFiles.value.map((file) => [file.publicId, file]))
    for (const result of results) {
      if (existingByPublicId.has(result.publicId)) continue
      const folderPath = normalizeFolderPath(result.folder) || extractFolderFromPublicId(result.publicId)
      existingByPublicId.set(result.publicId, {
        id: null,
        fileName: result.originalFilename || fileName(result.publicId),
        publicId: result.publicId,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes,
        secureUrl: result.secureUrl,
        createdAt: new Date().toISOString(),
        uploadedBy: null,
        isSaved: false,
        canSaveToProject: true,
        projectId: currentProjectId.value,
        folderPath,
      })
    }

    recentFiles.value = [...existingByPublicId.values()]

    const allByPublicId = new Map(allFiles.value.map((file) => [file.publicId, file]))
    for (const [key, file] of existingByPublicId) {
      if (!allByPublicId.has(key)) {
        allByPublicId.set(key, file)
      }
    }
    allFiles.value = [...allByPublicId.values()]
  }

  function resetFilesState() {
    recentFiles.value = []
    allFiles.value = []
    loadingFiles.value = false
    deletingFile.value = null
    latestFilesRequestId.value += 1
  }

  return {
    recentFiles,
    allFiles,
    loadingFiles,
    deletingFile,
    loadFiles,
    loadAllFiles,
    deleteFile,
    refreshAfterUpload,
    mergeOptimisticUploadedFiles,
    resetFilesState,
  }
}

function extractFolderFromPublicId(publicId: string): string {
  const parts = publicId.split('/').filter(Boolean)
  return parts.length <= 1 ? '' : parts.slice(0, -1).join('/')
}

function fileName(publicId: string): string {
  return publicId.split('/').pop() ?? publicId
}
