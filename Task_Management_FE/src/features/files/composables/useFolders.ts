import { computed, ref, type Ref } from 'vue'
import { getFolderMetadata, normalizeFolderPath } from '@/api/cloudinary'
import type { CloudinaryFolder } from '../types/files-view.types'

interface FolderRow extends CloudinaryFolder {
  depth: number
  hasChildren: boolean
}

interface UseFoldersOptions {
  currentFolder: Ref<string>
  currentProjectId: Ref<string | null>
  toast: { error: (message: string) => void }
  errorMessage: (error: unknown, fallback: string) => string
}

const EMPTY_FOLDER_NAME = 'Root'

export function useFolders(options: UseFoldersOptions) {
  const { currentFolder, currentProjectId, toast, errorMessage } = options

  const folders = ref<CloudinaryFolder[]>([])
  const loadingFolders = ref(false)
  const expandedFolderPaths = ref<Set<string>>(new Set())

  const folderRows = computed<FolderRow[]>(() => buildFolderRows(folders.value, expandedFolderPaths.value, currentFolder.value))

  async function loadFolders() {
    if (!currentProjectId.value) {
      folders.value = []
      currentFolder.value = ''
      return
    }

    loadingFolders.value = true
    try {
      const backendFolders = await getFolderMetadata(currentProjectId.value)
      const loaded = backendFolders.map((folder) => ({
        name: folder.name || (folder.path ? folder.path.split('/').pop() || folder.path : EMPTY_FOLDER_NAME),
        path: normalizeFolderPath(folder.path),
        fileCount: folder.fileCount,
      }))
      loaded.sort((a, b) => a.path.localeCompare(b.path))
      autoExpandRoots(loaded)
      folders.value = loaded
      if (!folders.value.some((folder) => folder.path === currentFolder.value)) {
        currentFolder.value = folders.value[0]?.path ?? ''
      }
    } catch (error) {
      folders.value = []
      currentFolder.value = ''
      console.error('[FilesView] loadFolders failed', error)
      toast.error(errorMessage(error, 'Cannot load folders'))
    } finally {
      loadingFolders.value = false
    }
  }

  function autoExpandRoots(allFolders: CloudinaryFolder[]) {
    const nextExpanded = new Set(expandedFolderPaths.value)
    for (const folder of allFolders) {
      if (getDepth(folder.path) === 0) {
        nextExpanded.add(folder.path)
      }
    }
    expandedFolderPaths.value = nextExpanded
  }

  function expandAncestors(path: string) {
    const nextExpanded = new Set(expandedFolderPaths.value)
    const segments = path.split('/').filter(Boolean)
    for (let i = 1; i <= segments.length; i++) {
      nextExpanded.add(segments.slice(0, i).join('/'))
    }
    expandedFolderPaths.value = nextExpanded
  }

  function toggleFolderExpand(path: string) {
    const nextExpanded = new Set(expandedFolderPaths.value)
    if (nextExpanded.has(path)) {
      nextExpanded.delete(path)
    } else {
      nextExpanded.add(path)
    }
    expandedFolderPaths.value = nextExpanded
  }

  function isExpanded(path: string) {
    return expandedFolderPaths.value.has(path)
  }

  function resetFoldersState() {
    folders.value = []
    expandedFolderPaths.value = new Set()
    loadingFolders.value = false
    currentFolder.value = ''
  }

  return {
    folders,
    folderRows,
    loadingFolders,
    expandedFolderPaths,
    loadFolders,
    autoExpandRoots,
    expandAncestors,
    toggleFolderExpand,
    isExpanded,
    resetFoldersState,
  }
}

function buildFolderRows(allFolders: CloudinaryFolder[], expandedPaths: Set<string>, currentFolder: string): FolderRow[] {
  const childrenByParent = new Map<string, CloudinaryFolder[]>()
  for (const folder of allFolders) {
    if (!folder.path) continue
    const parentPath = getParentPath(folder.path)
    const siblings = childrenByParent.get(parentPath) ?? []
    siblings.push(folder)
    childrenByParent.set(parentPath, siblings)
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.path.localeCompare(b.path))
  }

  const rows: FolderRow[] = []
  const walk = (parentPath: string, depth: number) => {
    for (const folder of childrenByParent.get(parentPath) ?? []) {
      const hasChildren = (childrenByParent.get(folder.path)?.length ?? 0) > 0
      rows.push({ ...folder, depth, hasChildren })
      if (hasChildren && (expandedPaths.has(folder.path) || currentFolder === folder.path)) {
        walk(folder.path, depth + 1)
      }
    }
  }

  walk('', 0)
  return rows
}

function getDepth(path: string) {
  return Math.max(path.split('/').filter(Boolean).length - 1, 0)
}

function getParentPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts.length <= 1 ? '' : parts.slice(0, -1).join('/')
}
