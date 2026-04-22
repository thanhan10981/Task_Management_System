<template>
  <section class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 text-sm font-semibold px-6 text-center">
    <p v-if="loading">Preparing secure file link...</p>
    <p v-else class="text-red-700">{{ errorText }}</p>
  </section>
</template>

<script setup lang="ts">
import {
  useFileDownloadAccessQuery,
  useFilePreviewAccessQuery,
} from '@/features/files/composables/useFileAccessQuery'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const DOWNLOAD_EVENT_KEY = 'tms:file-download-event'

const route = useRoute()
const loading = ref(true)
const errorText = ref('Unable to open this file. Please close this tab and try again.')
const fileId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const mode = computed(() => (route.query.mode === 'preview' ? 'preview' : 'download'))
const previewAccessQuery = useFilePreviewAccessQuery(fileId, computed(() => mode.value === 'preview'))
const downloadAccessQuery = useFileDownloadAccessQuery(fileId, computed(() => mode.value === 'download'))

watch(
  fileId,
  (currentFileId) => {
    if (currentFileId) return
    loading.value = false
    errorText.value = 'Invalid file identifier.'
  },
  { immediate: true },
)

watch(
  () => previewAccessQuery.data.value,
  (signedUrl) => {
    if (!signedUrl) return
    window.location.replace(signedUrl)
  },
)

watch(
  () => downloadAccessQuery.data.value,
  async (payload) => {
    if (!payload || !fileId.value) return
    try {
      await downloadWithFileName(payload.downloadUrl, payload.fileName)
      notifyDownloadSuccess(fileId.value, payload.fileName)
      tryCloseCurrentTab()
      loading.value = false
      errorText.value = 'Downloaded successfully. You can close this tab.'
    } catch (error) {
      loading.value = false
      errorText.value = extractErrorMessage(error)
    }
  },
)

watch(
  [() => previewAccessQuery.isPending.value, () => downloadAccessQuery.isPending.value],
  ([previewPending, downloadPending]) => {
    if (!fileId.value) return
    loading.value = previewPending || downloadPending
  },
  { immediate: true },
)

watch(
  () => previewAccessQuery.error.value ?? downloadAccessQuery.error.value,
  (error) => {
    if (!error) return
    loading.value = false
    errorText.value = extractErrorMessage(error)
  },
  { immediate: true },
)

async function downloadWithFileName(downloadUrl: string, fileName: string) {
  const response = await fetch(downloadUrl)
  if (!response.ok) throw new Error('Unable to download file. Please try again.')
  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = sanitizeFileName(fileName)
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim()
  if (!trimmed) return 'file'
  return trimmed.replace(/[\\/:*?"<>|]/g, '_')
}

function notifyDownloadSuccess(fileId: string, fileName: string) {
  const payload = { fileId, fileName: sanitizeFileName(fileName), timestamp: Date.now() }
  localStorage.setItem(DOWNLOAD_EVENT_KEY, JSON.stringify(payload))
}

function tryCloseCurrentTab() {
  window.close()
}

function extractErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return 'Unable to open this file. Please close this tab and try again.'
}
</script>
