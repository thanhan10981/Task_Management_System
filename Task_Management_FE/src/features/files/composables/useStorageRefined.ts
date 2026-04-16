import { computed, type Ref } from 'vue'
import { normalizeFolderPath } from '@/api/cloudinary'
import type { CloudinaryFile, CloudinaryFolder } from '../types/files-view.types'

interface UseStorageOptions {
  allFiles: Ref<CloudinaryFile[]>
  folders: Ref<CloudinaryFolder[]>
}

export function useStorageRefined(options: UseStorageOptions) {
  const { allFiles, folders } = options

  const totalByteUsed = computed(() => allFiles.value.reduce((acc, f) => acc + (f.bytes || 0), 0))
  const usedStorage = computed(() => formatBytes(totalByteUsed.value))

  const storagePercent = computed(() => {
    const maxBytes = 5 * 1024 * 1024 * 1024
    const pct = Math.round((totalByteUsed.value / maxBytes) * 100)
    return Math.min(Math.max(pct, allFiles.value.length ? 3 : 0), 99)
  })

  const totalStorage = computed(() => '5 GB')

  const storageItems = computed(() => {
    const src = allFiles.value
    const isImg = (f: CloudinaryFile) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes((f.format || '').toLowerCase())
    const isDoc = (f: CloudinaryFile) => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'ppt', 'pptx'].includes((f.format || '').toLowerCase())
    const isMedia = (f: CloudinaryFile) => ['mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'aac', 'ogg'].includes((f.format || '').toLowerCase())

    const images = src.filter(isImg)
    const docs = src.filter(isDoc)
    const media = src.filter(isMedia)
    const other = src.filter((f) => !isImg(f) && !isDoc(f) && !isMedia(f))

    const sumBytes = (arr: CloudinaryFile[]) => arr.reduce((a, f) => a + (f.bytes || 0), 0)

    return [
      { label: 'Media', icon: 'media', size: formatBytes(sumBytes(media)), color: '#6366f1', bytes: sumBytes(media) },
      { label: 'Documents', icon: 'document', size: formatBytes(sumBytes(docs)), color: '#f59e0b', bytes: sumBytes(docs) },
      { label: 'Images', icon: 'image', size: formatBytes(sumBytes(images)), color: '#ef4444', bytes: sumBytes(images) },
      { label: 'Other', icon: 'other', size: formatBytes(sumBytes(other)), color: '#3b82f6', bytes: sumBytes(other) },
    ]
  })

  function applyFolderCountsFromFiles(files: CloudinaryFile[]) {
    if (!folders.value.length) return

    const countByPath = new Map<string, number>()
    for (const file of files) {
      const fileFolderPath = normalizeFolderPath(file.folderPath) || extractFolderFromPublicId(file.publicId)
      const segments = fileFolderPath.split('/').filter(Boolean)

      for (let i = 1; i <= segments.length; i++) {
        const path = segments.slice(0, i).join('/')
        countByPath.set(path, (countByPath.get(path) ?? 0) + 1)
      }
    }

    folders.value = folders.value.map((folder) => {
      const normalizedPath = normalizeFolderPath(folder.path)
      const derivedCount = countByPath.get(normalizedPath) ?? 0
      return {
        ...folder,
        fileCount: Math.max(folder.fileCount ?? 0, derivedCount),
      }
    })
  }

  return {
    totalByteUsed,
    usedStorage,
    storagePercent,
    totalStorage,
    storageItems,
    applyFolderCountsFromFiles,
  }
}

function extractFolderFromPublicId(publicId: string): string {
  const parts = publicId.split('/').filter(Boolean)
  return parts.length <= 1 ? '' : parts.slice(0, -1).join('/')
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index >= 2 ? 1 : 0)} ${units[index]}`
}
