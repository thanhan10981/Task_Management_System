<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { onMounted } from 'vue'

const { initTheme } = useTheme()
initTheme()

onMounted(() => {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  // Trigger fade-out after first paint
  requestAnimationFrame(() => {
    splash.classList.add('is-hiding')
    setTimeout(() => splash.remove(), 480)
  })
})
</script>
