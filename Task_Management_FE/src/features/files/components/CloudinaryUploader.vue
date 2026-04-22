<template>
  <div class="cu-wrap">
    <!-- Top row: slot for trigger (upload label) lives outside, but we expose the input here -->
    <div class="cu-top-row">
      <!-- Folder badge -->
      <span v-if="folder" class="cu-folder-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        {{ folder }}
      </span>

      <!-- Upload trigger label -->
      <label class="cu-upload-btn" for="cloudinary-upload-input">
        Upload
        <input
          id="cloudinary-upload-input"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          class="cu-hidden-input"
          @change="handleFileSelect"
        />
      </label>
    </div>

    <!-- Drop zone -->
    <div
      class="cu-dropzone"
      :class="{ 'cu-dropzone--active': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <svg class="cu-cloud-icon" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M52 38H14a12 12 0 1 1 2.18-23.81A16 16 0 0 1 48 20a10 10 0 0 1 4 19.16V38z" fill="#1e293b"/>
      </svg>
      <p class="cu-drop-title">Drag and drop files here</p>
      <p class="cu-drop-sub">Upload to folder: {{ folder || 'No folder' }}</p>
      <p class="cu-drop-max">Max 20MB per file</p>
    </div>

    <!-- Upload queue -->
    <div v-if="uploadQueue.length" class="cu-queue">
      <h3 class="cu-queue-title">Upload Progress</h3>
      <div v-for="item in uploadQueue" :key="item.id" class="cu-queue-item">
        <div class="cu-queue-row">
          <p class="cu-queue-name">{{ item.file.name }}</p>
          <span class="cu-queue-status">{{ uploadStatusLabel(item.status, item.progress) }}</span>
        </div>
        <div class="cu-progress-track">
          <div class="cu-progress-bar" :style="{ width: `${item.progress}%` }" />
        </div>
        <p v-if="item.status === 'cloudinary-success' || item.status === 'saving-metadata'" class="cu-msg cu-msg--warn">
          {{ item.status === 'cloudinary-success' ? 'Uploaded to Cloudinary, preparing metadata...' : 'Syncing metadata to server...' }}
        </p>
        <p v-if="item.status === 'error'" class="cu-msg cu-msg--error">{{ item.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  normalizeFolderPath,
  type CloudinaryUploadResult,
  uploadProjectFileToBackend,
} from '@/api/cloudinary'
import { useProjectStore } from '@/stores/project.store'
import { storeToRefs } from 'pinia'
import { reactive, ref } from 'vue'
import type { UploadQueueItem } from '../types/files-view.types'

const props = defineProps<{
  folder: string
}>()

const emit = defineEmits<{
  uploaded: [results: CloudinaryUploadResult[]]
}>()

const isDragging = ref(false)
const uploadQueue = ref<UploadQueueItem[]>([])
const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files)
  input.value = ''
  void processFiles(files)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (!files.length) return
  void processFiles(files)
}

async function processFiles(files: File[]) {
  const projectIdAtStart = currentProjectId.value
  if (!projectIdAtStart) {
    uploadQueue.value.unshift({
      id: `${Date.now()}-${Math.random()}`,
      file: files[0],
      status: 'error',
      progress: 0,
      error: 'Missing current project. Please select a project first.',
    })
    return
  }

  const uploadedResults: CloudinaryUploadResult[] = []
  let hasTimeoutLikeError = false

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      uploadQueue.value.unshift({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'error',
        progress: 0,
        error: 'File exceeds 20MB limit',
      })
      continue
    }

    const queueItem = reactive<UploadQueueItem>({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
      progress: 0,
    })

    uploadQueue.value.unshift(queueItem)

    try {
      const result = await uploadProjectFileToBackend(projectIdAtStart, file, {
        folderPath: normalizeFolderPath(props.folder) || undefined,
      })
      queueItem.progress = 100
      queueItem.status = 'cloudinary-success'
      queueItem.progress = 100
      queueItem.result = result
      uploadedResults.push(result)
      queueItem.status = 'saving-metadata'
      queueItem.status = 'success'
    } catch (error) {
      queueItem.status = 'error'
      queueItem.error = error instanceof Error ? error.message : 'Upload or metadata sync failed'
      if (isUploadTimeoutLikeError(error)) {
        hasTimeoutLikeError = true
      }
    }
  }

  if (uploadedResults.length || hasTimeoutLikeError) {
    emit('uploaded', uploadedResults)
  }
}

function isUploadTimeoutLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('timed out') || message.includes('timeout')
}

function uploadStatusLabel(status: UploadQueueItem['status'], progress: number) {
  if (status === 'uploading') return `${progress}%`
  if (status === 'cloudinary-success') return 'Cloudinary done'
  if (status === 'saving-metadata') return 'Saving metadata'
  if (status === 'success') return 'Done'
  return 'Failed'
}
</script>

<style scoped>
/* Wrapper */
.cu-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Top row: folder badge + upload button side by side */
.cu-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Folder badge */
.cu-folder-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: #ede9fe;
  border-radius: 6px;
  padding: 4px 10px;
  white-space: nowrap;
}

/* Upload button */
.cu-upload-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #38bdf8);
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: opacity 0.18s, transform 0.15s;
  user-select: none;
  margin-left: auto;
}
.cu-upload-btn:hover { opacity: 0.88; transform: translateY(-1px); }

.cu-hidden-input { display: none; }

/* Drop zone */
.cu-dropzone {
  border: 2px dashed var(--border-medium);
  border-radius: 16px;
  background: var(--bg-surface-2);
  padding: 24px 16px;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
  cursor: default;
}
.cu-dropzone--active {
  border-color: #6366f1;
  background: var(--bg-hover);
}
.cu-dropzone:hover { border-color: #a5b4fc; }

.cu-cloud-icon {
  width: 36px;
  height: 27px;
  margin: 0 auto 8px;
  display: block;
}
.cu-drop-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0 0 4px;
}
.cu-drop-sub {
  font-size: 11px;
  color: #6366f1;
  margin: 0 0 2px;
}
.cu-drop-max {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 0;
}

/* Queue */
.cu-queue {
  border: 1px solid var(--border-medium);
  border-radius: 14px;
  background: var(--bg-surface-2);
  padding: 14px 16px;
}
.cu-queue-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0 0 10px;
}
.cu-queue-item { margin-bottom: 10px; }
.cu-queue-item:last-child { margin-bottom: 0; }
.cu-queue-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.cu-queue-name {
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
.cu-queue-status { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
.cu-progress-track {
  height: 6px;
  background: var(--bg-surface-3);
  border-radius: 99px;
  overflow: hidden;
}
.cu-progress-bar {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #6366f1, #38bdf8);
  transition: width 0.3s ease;
}
.cu-msg { font-size: 11px; margin: 3px 0 0; }
.cu-msg--warn { color: #d97706; }
.cu-msg--error { color: #ef4444; }
</style>
