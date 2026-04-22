<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ToastContainer from '@/components/common/ToastContainer.vue'

const { initTheme } = useTheme()
initTheme()
</script>
