<template>
  <div class="space-y-4">
    <label
      for="cloudinary-upload-input"
      class="inline-flex cursor-pointer items-center rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
    >
      Upload
      <input
        id="cloudinary-upload-input"
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        class="hidden"
        @change="handleFileSelect"
      />
    </label>

    <div
      class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition"
      :class="isDragging ? 'border-indigo-500 bg-indigo-50' : 'hover:border-indigo-400'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <p class="text-3xl">☁</p>
      <p class="mt-2 text-sm font-semibold text-slate-700">Drag and drop files here</p>
      <p class="mt-1 text-xs text-slate-500">Upload to folder: {{ folder || 'No folder' }}</p>
      <p class="mt-1 text-xs text-slate-400">Max 20MB per file</p>
    </div>

    <div v-if="uploadQueue.length" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Upload Progress</h3>
      <div v-for="item in uploadQueue" :key="item.id" class="mb-3 last:mb-0">
        <div class="mb-1 flex items-center justify-between gap-3">
          <p class="truncate text-sm text-slate-700">{{ item.file.name }}</p>
          <span class="text-xs text-slate-500">{{ uploadStatusLabel(item.status, item.progress) }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all"
            :style="{ width: `${item.progress}%` }"
          />
        </div>
        <p
          v-if="item.status === 'cloudinary-success' || item.status === 'saving-metadata'"
          class="mt-1 text-xs text-amber-600"
        >
          {{ item.status === 'cloudinary-success' ? 'Uploaded to Cloudinary, preparing metadata...' : 'Syncing metadata to server...' }}
        </p>
        <p v-if="item.status === 'error'" class="mt-1 text-xs text-rose-600">{{ item.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildProjectScopedFolderPath,
  type CloudinaryUploadResult,
  normalizeFolderPath,
  saveUploadedFileMetadata,
  uploadToCloudinary,
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
      const logicalFolderPath = normalizeFolderPath(props.folder)
      const scopedFolderPath = buildProjectScopedFolderPath(projectIdAtStart, logicalFolderPath)
      const result = await uploadToCloudinary(file, scopedFolderPath, (evt) => {
        queueItem.progress = evt.percentage
      })

      queueItem.status = 'cloudinary-success'
      queueItem.progress = 100
      queueItem.result = result
      uploadedResults.push(result)

      queueItem.status = 'saving-metadata'
      try {
        await saveUploadedFileMetadata({
          fileName: result.originalFilename || extractFileName(result.publicId),
          secureUrl: result.secureUrl,
          publicId: result.publicId,
          projectId: projectIdAtStart,
          format: result.format,
          resourceType: result.resourceType,
          folderPath: logicalFolderPath,
          sizeBytes: result.bytes,
        })
        queueItem.status = 'success'
      } catch (metadataError) {
        queueItem.status = 'error'
        queueItem.error = metadataError instanceof Error ? metadataError.message : 'Metadata sync failed'
        console.error('[CloudinaryUploader] Metadata sync failed', metadataError)
        continue
      }
    } catch (error) {
      queueItem.status = 'error'
      queueItem.error = error instanceof Error ? error.message : 'Upload or metadata sync failed'
    }
  }

  if (uploadedResults.length) {
    emit('uploaded', uploadedResults)
  }
}

function extractFileName(publicId: string) {
  return publicId.split('/').pop() ?? publicId
}

function uploadStatusLabel(status: UploadQueueItem['status'], progress: number) {
  if (status === 'uploading') {
    return `${progress}%`
  }

  if (status === 'cloudinary-success') {
    return 'Cloudinary done'
  }

  if (status === 'saving-metadata') {
    return 'Saving metadata'
  }

  if (status === 'success') {
    return 'Done'
  }

  return 'Failed'
}
</script>
