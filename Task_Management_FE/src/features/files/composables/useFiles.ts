import { computed, ref, watch, type Ref } from 'vue'
import {
  deleteFileMetadata,
  getUploadedFileMetadata,
  normalizeFolderPath,
  type CloudinaryUploadResult,
} from '@/api/cloudinary'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
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
  const queryClient = useQueryClient()

  const recentFiles = ref<CloudinaryFile[]>([])
  const allFiles = ref<CloudinaryFile[]>([])
  const loadingFiles = ref(false)
  const deletingFile = ref<string | null>(null)
  const folderSignature = computed(() =>
    folders.value
      .map((folder) => normalizeFolderPath(folder.path))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join('|'),
  )

  const recentFilesQuery = useQuery({
    queryKey: computed(() =>
      QUERY_KEYS.files.list(
        currentProjectId.value ?? '',
        normalizeFolderPath(currentFolder.value),
        true,
      ),
    ),
    enabled: computed(() => Boolean(currentProjectId.value)),
    queryFn: async () => {
      if (!currentProjectId.value) {
        return []
      }

      const folderPath = normalizeFolderPath(currentFolder.value)
      return getUploadedFileMetadata(currentProjectId.value, folderPath || undefined, true)
    },
  })

  const allFilesQuery = useQuery({
    queryKey: computed(() =>
      QUERY_KEYS.files.allInProject(currentProjectId.value ?? '').concat(folderSignature.value),
    ),
    enabled: computed(() => Boolean(currentProjectId.value)),
    queryFn: async () => {
      if (!currentProjectId.value) {
        return []
      }

      const projectId = currentProjectId.value
      const rootAllFiles = await getUploadedFileMetadata(projectId, undefined, true)
      if (rootAllFiles.length || folders.value.length === 0) {
        return rootAllFiles
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

      return [...mergedByPublicId.values()]
    },
  })

  watch(
    () => currentProjectId.value,
    (projectId) => {
      if (projectId) {
        return
      }

      recentFiles.value = []
      allFiles.value = []
    },
    { immediate: true },
  )

  watch(
    () => recentFilesQuery.isFetching.value,
    (isFetching) => {
      loadingFiles.value = isFetching
    },
    { immediate: true },
  )

  watch(
    () => recentFilesQuery.data.value,
    (files) => {
      if (!files || !currentProjectId.value) {
        return
      }

      recentFiles.value = files
    },
    { immediate: true },
  )

  watch(
    () => recentFilesQuery.error.value,
    (error) => {
      if (!error || !currentProjectId.value) {
        return
      }

      recentFiles.value = []
      console.error('[FilesView] loadFiles failed', error)
      toast.error(errorMessage(error, 'Cannot load files'))
    },
  )

  watch(
    () => allFilesQuery.data.value,
    (files) => {
      if (!files || !currentProjectId.value) {
        return
      }

      allFiles.value = files
    },
    { immediate: true },
  )

  watch(
    () => allFilesQuery.error.value,
    (error) => {
      if (!error || !currentProjectId.value) {
        return
      }

      console.error('[FilesView] loadAllFiles failed', error)
    },
  )

  async function loadFiles() {
    if (!currentProjectId.value) {
      recentFiles.value = []
      return
    }

    await recentFilesQuery.refetch()
  }

  async function loadAllFiles() {
    if (!currentProjectId.value) {
      allFiles.value = []
      return
    }

    await allFilesQuery.refetch()
  }

  async function deleteFile(file: CloudinaryFile) {
    const fileId = file.id
    if (!fileId) return
    const displayName = (file.fileName || fileName(file.publicId) || 'this file').trim()

    deletingFile.value = fileId
    try {
      await deleteFileMetadata(fileId)
      if (currentProjectId.value) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })
      }
      toast.success(`Deleted "${displayName}" successfully`)
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

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })

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
    deletingFile.value = null
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
