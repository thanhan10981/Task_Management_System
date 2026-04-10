<template>
  <section class="files-root">
    <!-- ── Header ────────────────────────────────────────────── -->
    <header class="files-header">
      <div>
        <h1 class="files-title">Files</h1>
        <p class="files-subtitle">Upload &amp; manage your folders</p>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click="showCreateFolder = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          Create New Folder
        </button>
        <button class="btn-primary" @click="triggerUploader">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload
        </button>
      </div>
    </header>

    <!-- ── Main grid ──────────────────────────────────────────── -->
    <div class="files-grid">
      <!-- ══ Left column ════════════════════════════════════════ -->
      <div class="left-col">

        <!-- Folders card -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="folder-icon-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span class="card-title">All Files</span>
            </div>
            <button class="show-all-btn" @click="refreshAll">
              Show All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <!-- Skeleton -->
          <div v-if="loadingFolders" class="folder-grid">
            <div v-for="n in 6" :key="n" class="folder-card-skeleton" />
          </div>

          <!-- Empty -->
          <div v-else-if="folderRows.length === 0" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <p>No folders found</p>
          </div>

          <!-- Grid -->
          <div v-else class="folder-grid">
            <button
              v-for="row in folderRows"
              :key="row.path"
              class="folder-card"
              :class="currentFolder === row.path ? 'folder-card--active' : ''"
              @click="selectFolder(row.path)"
            >
              <!-- colored folder icon -->
              <div class="fc-top">
                <div class="fc-icon" :style="{ background: folderColor(row.path) }">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <!-- expand toggle if has children -->
                <button
                  v-if="row.hasChildren"
                  class="fc-expand"
                  @click.stop="toggleFolderExpand(row.path)"
                >
                  {{ isExpanded(row.path) ? '▾' : '▸' }}
                </button>
              </div>
              <p class="fc-name">{{ row.name }}</p>
              <p class="fc-count">{{ row.fileCount }} files</p>
              <!-- depth indicator -->
              <div v-if="row.depth > 0" class="fc-depth-bar" :style="{ width: `${(row.depth / 4) * 100}%` }" />
            </button>
          </div>
        </div>

        <!-- Recent Files card -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">Recent Files</span>
              <span v-if="currentFolder" class="folder-breadcrumb">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                {{ displayFolderName(currentFolder) }}
              </span>
            </div>
            <button class="show-all-btn" @click="loadFiles">
              Reload
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
            </button>
          </div>

          <!-- Skeleton -->
          <div v-if="loadingFiles" class="file-skeleton-list">
            <div v-for="n in 5" :key="n" class="file-skeleton-row" />
          </div>

          <!-- Empty -->
          <div v-else-if="recentFiles.length === 0" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No files in this folder</p>
          </div>

          <!-- Table -->
          <div v-else class="file-table-wrapper">
            <table class="file-table">
              <thead>
                <tr>
                  <th>
                    Name
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th>
                    Size
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th>
                    Last Modified
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th>
                    Members
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th>
                    Type
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in recentFiles" :key="file.publicId" class="file-row">
                  <td>
                    <div class="file-name-cell">
                      <span class="file-type-badge" :style="{ background: fileTypeBg(file.format) }">
                        {{ getFileIconText(file.format) }}
                      </span>
                      <span class="file-name">{{ file.fileName || fileName(file.publicId) }}</span>
                    </div>
                  </td>
                  <td class="td-secondary">{{ formatBytes(file.bytes) }}</td>
                  <td class="td-secondary">{{ formatDate(file.createdAt) }}</td>
                  <!-- Members / shared_with -->
                  <td>
                    <div class="member-avatars">
                      <template v-if="file.shared_with && file.shared_with.length">
                        <div
                          v-for="(member, idx) in file.shared_with.slice(0, 4)"
                          :key="member.id"
                          class="member-avatar"
                          :style="{ zIndex: 10 - idx, background: member.avatar ? 'transparent' : memberColor(member.id) }"
                          :title="member.name"
                        >
                          <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                          <span v-else>{{ memberInitials(member.name) }}</span>
                        </div>
                        <div
                          v-if="file.shared_with.length > 4"
                          class="member-avatar member-avatar--more"
                          :title="`${file.shared_with.length - 4} more members`"
                        >
                          +{{ file.shared_with.length - 4 }}
                        </div>
                      </template>
                      <span v-else class="member-empty">—</span>
                    </div>
                  </td>
                  <td>
                    <span class="format-chip">{{ (file.format || file.resourceType || 'file').toUpperCase() }}</span>
                  </td>
                  <td>
                    <div class="file-actions">
                      <button class="action-btn action-btn--open" title="Open" @click="openFile(file.secureUrl)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </button>
                      <button
                        class="action-btn action-btn--delete"
                        :disabled="deletingFile === file.id"
                        title="Delete"
                        @click="deleteFile(file)"
                      >
                        <svg v-if="deletingFile !== file.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
                      </button>
                      <button class="action-btn action-btn--more" title="More options">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ Right sidebar ══════════════════════════════════════ -->
      <aside class="right-col">

        <!-- Storage Donut card -->
        <div class="card storage-card">
          <h3 class="sidebar-card-title">Available Storage</h3>
          <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 100 100">
              <circle class="donut-bg" cx="50" cy="50" r="38" />
              <circle
                class="donut-fg"
                cx="50" cy="50" r="38"
                :stroke-dasharray="`${storagePercent * 2.388} 238.8`"
                stroke-dashoffset="0"
              />
            </svg>
            <div class="donut-label">
              <span class="donut-pct">{{ storagePercent }}%</span>
            </div>
          </div>
          <p class="storage-used-text">{{ usedStorage }} / {{ totalStorage }}</p>

          <!-- Breakdown -->
          <div class="storage-breakdown">
            <div v-for="item in storageItems" :key="item.label" class="storage-row">
              <div class="sr-left">
                <div class="sr-icon" :style="{ background: item.color + '22', color: item.color }">
                  <span>{{ item.icon }}</span>
                </div>
                <span class="sr-label">{{ item.label }}</span>
              </div>
              <div class="sr-right">
                <span class="sr-size">{{ item.size }}</span>
              </div>
            </div>
            <div class="storage-bar-row">
              <div class="storage-bar" :style="{ width: `${storagePercent}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }" />
            </div>
          </div>
        </div>

        <!-- Uploader card -->
        <div ref="uploaderRef" class="card uploader-card">
          <h3 class="sidebar-card-title">Upload Files</h3>
          <p v-if="currentFolder" class="uploader-folder-hint">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {{ displayFolderName(currentFolder) }}
          </p>
          <CloudinaryUploader :folder="currentFolder" @uploaded="handleUploaded" />
        </div>
      </aside>
    </div>

    <!-- ── Create Folder Modal ────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showCreateFolder"
          class="modal-overlay"
          @click.self="showCreateFolder = false"
        >
          <div class="modal-box">
            <div class="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            </div>
            <h3 class="modal-title">Create New Folder</h3>
            <p class="modal-desc">Enter a path like <code>tasks/attachments/design</code></p>

            <input
              v-model="newFolderName"
              class="modal-input"
              placeholder="Folder path..."
              autocomplete="off"
              @keyup.enter="createFolder"
            >

            <div class="modal-actions">
              <button class="btn-ghost" @click="showCreateFolder = false">Cancel</button>
              <button
                class="btn-primary"
                :disabled="creatingFolder || !newFolderName.trim()"
                @click="createFolder"
              >
                <svg v-if="creatingFolder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
                {{ creatingFolder ? 'Creating...' : 'Create Folder' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import CloudinaryUploader from '../components/CloudinaryUploader.vue'
import {
  createCloudinaryFolder,
  normalizeFolderPath,
  type CloudinaryUploadResult,
} from '@/api/cloudinary'
import { useToast } from '@/composables/useToast'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useProjectStore } from '@/stores/project.store'
import { useQueryClient } from '@tanstack/vue-query'
import { useFiles } from '../composables/useFiles'
import { useFolders } from '../composables/useFolders'
import { useStorage } from '../composables/useStorage'
import { storeToRefs } from 'pinia'
import {
  extractErrorMessage,
  fileName,
  fileTypeBg,
  folderColor,
  formatBytes,
  formatDate,
  getFileIconText,
  memberColor,
  memberInitials,
} from '../utils/file.utils'

const DEFAULT_FOLDER = ''
const MAX_FOLDER_REFRESH_RETRY = 3
const FOLDER_REFRESH_DELAY_MS = 350

const currentFolder = ref(DEFAULT_FOLDER)

const creatingFolder = ref(false)
const showCreateFolder = ref(false)
const newFolderName = ref('')
const uploaderRef = ref<HTMLElement | null>(null)

const toast = useToast()
const queryClient = useQueryClient()
const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)

function errorMessage(error: unknown, fallback: string) {
  return extractErrorMessage(error, fallback)
}

const {
  folders,
  folderRows,
  loadingFolders,
  loadFolders,
  expandAncestors,
  toggleFolderExpand,
  isExpanded,
  resetFoldersState,
} = useFolders({ currentFolder, currentProjectId, toast, errorMessage })

const {
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
} = useFiles({ currentFolder, currentProjectId, folders, loadFolders, toast, errorMessage })

const {
  usedStorage,
  storagePercent,
  totalStorage,
  storageItems,
  applyFolderCountsFromFiles,
} = useStorage({ allFiles, folders })

const lastAppliedFilesRef = ref<typeof allFiles.value | null>(null)

function syncFolderCounts() {
  const files = allFiles.value
  if (lastAppliedFilesRef.value === files) return

  applyFolderCountsFromFiles(files)
  lastAppliedFilesRef.value = files
}

async function loadAllData() {
  await loadFolders()
  await Promise.all([loadFiles(), loadAllFiles()])
  syncFolderCounts()
}

onMounted(async () => {
  if (!currentProjectId.value) {
    return
  }
  await loadAllData()
})

watch(currentProjectId, async () => {
  resetFoldersState()
  resetFilesState()
  currentFolder.value = DEFAULT_FOLDER
  lastAppliedFilesRef.value = null

  if (!currentProjectId.value) {
    applyFolderCountsFromFiles([])
    return
  }

  await loadAllData()
})

watch(
  () => allFiles.value,
  (nextFiles, prevFiles) => {
    if (nextFiles === prevFiles) return
    syncFolderCounts()
  },
  { deep: false },
)

async function refreshAll() {
  if (currentProjectId.value) {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })
  }
  await loadAllData()
}

function selectFolder(path: string) {
  currentFolder.value = normalizeFolderPath(path)
  expandAncestors(currentFolder.value)
  void loadFiles()
}

async function createFolder() {
  const path = normalizeFolderPath(newFolderName.value)
  if (!path) return
  creatingFolder.value = true
  try {
    if (!currentProjectId.value) {
      throw new Error('Missing current project. Please create a project first.')
    }

    await createCloudinaryFolder(currentProjectId.value, path)
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all })
    showCreateFolder.value = false
    newFolderName.value = ''
    await refreshFoldersUntilVisible(path)
    currentFolder.value = normalizeFolderPath(path)
    expandAncestors(currentFolder.value)
    await Promise.all([loadFiles(), loadAllFiles()])
    syncFolderCounts()
    toast.success('Folder created')
  } catch (error) {
    toast.error(errorMessage(error, 'Create folder failed'))
  } finally {
    creatingFolder.value = false
  }
}

async function refreshFoldersUntilVisible(path: string) {
  for (let attempt = 0; attempt < MAX_FOLDER_REFRESH_RETRY; attempt++) {
    await loadFolders()
    if (folders.value.some((folder) => folder.path === path)) return
    await new Promise((resolve) => { window.setTimeout(resolve, FOLDER_REFRESH_DELAY_MS) })
  }
}

async function handleUploaded(results: CloudinaryUploadResult[]) {
  if (results.length) toast.success(`Uploaded ${results.length} file${results.length > 1 ? 's' : ''}`)
  const uploadedPublicIds = results.map((result) => result.publicId)
  const synced = await refreshAfterUpload(uploadedPublicIds)
  if (!synced && results.length) {
    mergeOptimisticUploadedFiles(results)
  }
  syncFolderCounts()
}

function triggerUploader() {
  uploaderRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function openFile(url: string) { window.open(url, '_blank', 'noopener,noreferrer') }
function displayFolderName(path: string) { return normalizeFolderPath(path).split('/').filter(Boolean).pop() ?? 'Root' }
</script>

<style scoped>
/* ─── Root ──────────────────────────────────────────────────── */
.files-root {
  min-height: 100%;
  padding: 0;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ─── Header ─────────────────────────────────────────────────── */
.files-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}
.files-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}
.files-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── Buttons ─────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 12px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.btn-outline:hover { border-color: #6366f1; color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,0.12); }

.btn-ghost {
  padding: 10px 20px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #f8fafc; }

/* ─── Grid layout ─────────────────────────────────────────────── */
.files-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 1024px) {
  .files-grid { grid-template-columns: 1fr; }
}
.left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }

/* ─── Card ────────────────────────────────────────────────────── */
.card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-header-left { display: flex; align-items: center; gap: 10px; }
.card-title { font-size: 15px; font-weight: 700; color: #1e293b; }

.folder-icon-sm {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

.show-all-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: #6366f1;
  background: none; border: none; cursor: pointer;
  padding: 4px 10px; border-radius: 8px;
  transition: background 0.15s;
}
.show-all-btn:hover { background: #ede9fe; }

/* ─── Folder grid ──────────────────────────────────────────────── */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 780px) { .folder-grid { grid-template-columns: repeat(2,1fr); } }

.folder-card {
  position: relative;
  display: flex; flex-direction: column;
  padding: 16px 14px 12px;
  border-radius: 16px;
  border: 1.5px solid #f1f5f9;
  background: #fafbfc;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  overflow: hidden;
}
.folder-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 16px rgba(99,102,241,0.10);
  transform: translateY(-2px);
}
.folder-card--active {
  border-color: #6366f1 !important;
  background: linear-gradient(135deg, #f0f0ff, #f5f3ff);
  box-shadow: 0 4px 16px rgba(99,102,241,0.15);
}

.fc-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 10px;
}
.fc-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.fc-expand {
  background: none; border: none; cursor: pointer;
  font-size: 14px; color: #94a3b8; padding: 2px 4px;
  border-radius: 6px;
  transition: background 0.15s;
}
.fc-expand:hover { background: #e2e8f0; }

.fc-name {
  font-size: 13px; font-weight: 700; color: #1e293b;
  margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}
.fc-count { font-size: 11px; color: #94a3b8; margin: 0; }
.fc-depth-bar {
  position: absolute; bottom: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 0 3px 3px 0;
}

/* ─── Skeleton ────────────────────────────────────────────────── */
.folder-card-skeleton {
  height: 100px; border-radius: 16px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.file-skeleton-list { display: flex; flex-direction: column; gap: 10px; }
.file-skeleton-row {
  height: 44px; border-radius: 10px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* ─── Empty state ─────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 0;
  color: #94a3b8; font-size: 13px; gap: 10px;
  border: 1.5px dashed #e2e8f0; border-radius: 14px;
}

/* ─── File table ──────────────────────────────────────────────── */
.file-table-wrapper { overflow-x: auto; }
.file-table {
  width: 100%; border-collapse: collapse;
  min-width: 560px;
}
.file-table thead tr th {
  padding: 8px 14px;
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em;
  text-align: left; white-space: nowrap;
  border-bottom: 1.5px solid #f1f5f9;
}
.file-table thead th svg { vertical-align: middle; display: inline-block; }
.file-row { transition: background 0.15s; }
.file-row:hover { background: #f8f9ff; }
.file-row td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}
.file-row:last-child td { border-bottom: none; }

.file-name-cell { display: flex; align-items: center; gap: 10px; }
.file-type-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 38px; height: 28px; padding: 0 6px;
  border-radius: 8px;
  font-size: 10px; font-weight: 800; letter-spacing: 0.03em;
  color: #334155; white-space: nowrap; flex-shrink: 0;
}
.file-name {
  font-weight: 600; color: #1e293b;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.td-secondary { color: #64748b; }
.format-chip {
  display: inline-block;
  padding: 2px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  background: #f1f5f9; color: #475569;
}

/* ─── Member avatars ─────────────────────────────────────────── */
.member-avatars {
  display: flex;
  align-items: center;
  padding: 2px 0;
}
.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  overflow: hidden;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.01em;
  cursor: default;
  transition: transform 0.15s, z-index 0.15s;
  position: relative;
  flex-shrink: 0;
}
.member-avatar:first-child { margin-left: 0; }
.member-avatar:hover { transform: translateY(-3px) scale(1.1); z-index: 20 !important; }
.member-avatar img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.member-avatar--more {
  background: #e2e8f0 !important;
  color: #475569;
  font-size: 9px;
  font-weight: 800;
}
.member-empty { color: #cbd5e1; font-size: 13px; }

/* ─── File actions ────────────────────────────────────────────── */
.file-actions { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
.action-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid #e2e8f0; background: #fff;
  cursor: pointer; transition: all 0.15s;
}
.action-btn--open { color: #6366f1; }
.action-btn--open:hover { border-color: #6366f1; background: #ede9fe; }
.action-btn--delete { color: #ef4444; }
.action-btn--delete:hover { border-color: #ef4444; background: #fff1f2; }
.action-btn--delete:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn--more { color: #94a3b8; }
.action-btn--more:hover { border-color: #94a3b8; background: #f8fafc; }

/* ─── Sidebar cards ───────────────────────────────────────────── */
.sidebar-card-title {
  font-size: 16px; font-weight: 700; color: #1e293b;
  margin: 0 0 18px;
}

/* Storage donut */
.donut-wrap {
  position: relative;
  width: 110px; height: 110px;
  margin: 0 auto 10px;
}
.donut-svg { width: 110px; height: 110px; transform: rotate(-90deg); }
.donut-bg { fill: none; stroke: #f1f5f9; stroke-width: 12; }
.donut-fg {
  fill: none;
  stroke: url(#donutGrad);
  stroke: #6366f1;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease;
}
.donut-label {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.donut-pct { font-size: 22px; font-weight: 800; color: #1e293b; }
.storage-used-text { text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 18px; }

.storage-breakdown { display: flex; flex-direction: column; gap: 10px; }
.storage-row {
  display: flex; align-items: center; justify-content: space-between;
}
.sr-left { display: flex; align-items: center; gap: 10px; }
.sr-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.sr-label { font-size: 13px; font-weight: 600; color: #334155; }
.sr-size { font-size: 12px; color: #94a3b8; font-weight: 600; }
.storage-bar-row {
  height: 4px; background: #f1f5f9; border-radius: 4px; margin-top: 4px;
}
.storage-bar { height: 100%; border-radius: 4px; transition: width 0.8s ease; }

/* Activity chart */
.chart-wrap { display: flex; flex-direction: column; gap: 12px; }
.chart-bars {
  display: flex; align-items: flex-end; gap: 6px;
  height: 100px; padding: 0 4px;
}
.chart-bar-group {
  flex: 1; display: flex; flex-direction: column-reverse; gap: 2px;
  border-radius: 8px; overflow: hidden;
}
.chart-bar-seg {
  width: 100%; border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
}
.chart-legend { display: flex; gap: 14px; justify-content: center; }
.chart-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; font-weight: 600; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }

/* Uploader card */
.uploader-card { padding: 20px; }

/* ─── Modal ───────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  padding: 16px;
}
.modal-box {
  width: 100%; max-width: 420px;
  background: #fff; border-radius: 24px;
  padding: 32px; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  text-align: center;
}
.modal-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
  color: #6366f1;
}
.modal-title { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.modal-desc { font-size: 13px; color: #94a3b8; margin: 0 0 20px; }
.modal-desc code {
  background: #f1f5f9; padding: 1px 6px; border-radius: 5px;
  font-size: 12px; color: #6366f1;
}
.modal-input {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px 16px; font-size: 14px; color: #1e293b;
  outline: none; transition: border-color 0.2s;
  margin-bottom: 20px;
}
.modal-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.modal-actions { display: flex; gap: 10px; }
.modal-actions > * { flex: 1; justify-content: center; }

/* ─── Transitions ─────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Uploader card folder hint */
.uploader-folder-hint {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #6366f1;
  background: #ede9fe; border-radius: 6px;
  padding: 3px 8px; margin-bottom: 12px;
}

/* Folder breadcrumb in card header */
.folder-breadcrumb {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #6366f1;
  background: #ede9fe; border-radius: 6px;
  padding: 2px 8px; max-width: 180px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── Spin animation ──────────────────────────────────────────── */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
