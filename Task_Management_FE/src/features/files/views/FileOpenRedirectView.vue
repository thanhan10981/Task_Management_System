<template>
  <section class="file-open-redirect">
    <p v-if="loading">Preparing secure file link...</p>
    <p v-else class="error-text">{{ errorText }}</p>
  </section>
</template>

<script setup lang="ts">
import { getFileDownloadUrl, getFilePreviewUrl } from '@/api/cloudinary'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const DOWNLOAD_EVENT_KEY = 'tms:file-download-event'

const route = useRoute()
const loading = ref(true)
const errorText = ref('Unable to open this file. Please close this tab and try again.')

onMounted(async () => {
  const fileId = typeof route.params.id === 'string' ? route.params.id : ''
  const mode = route.query.mode === 'preview' ? 'preview' : 'download'

  if (!fileId) {
    loading.value = false
    errorText.value = 'Invalid file identifier.'
    return
  }

  try {
    if (mode === 'preview') {
      const signedUrl = await getFilePreviewUrl(fileId)
      window.location.replace(signedUrl)
      return
    }

    const { downloadUrl, fileName } = await getFileDownloadUrl(fileId)
    await downloadWithFileName(downloadUrl, fileName)
    notifyDownloadSuccess(fileId, fileName)
    tryCloseCurrentTab()
    loading.value = false
    errorText.value = 'Downloaded successfully. You can close this tab.'
  } catch (error) {
    loading.value = false

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message
      if (typeof message === 'string' && message) {
        errorText.value = message
      }
    }
  }
})

async function downloadWithFileName(downloadUrl: string, fileName: string) {
  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error('Unable to download file. Please try again.')
  }

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
  if (!trimmed) {
    return 'file'
  }

  return trimmed.replace(/[\\/:*?"<>|]/g, '_')
}

function notifyDownloadSuccess(fileId: string, fileName: string) {
  const payload = {
    fileId,
    fileName: sanitizeFileName(fileName),
    timestamp: Date.now(),
  }

  localStorage.setItem(DOWNLOAD_EVENT_KEY, JSON.stringify(payload))
}

function tryCloseCurrentTab() {
  // Works when this page is opened by script from the parent app tab.
  window.close()
}
</script>

<style scoped>
.file-open-redirect {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  padding: 24px;
  text-align: center;
}

.error-text {
  color: #b91c1c;
}
</style>
