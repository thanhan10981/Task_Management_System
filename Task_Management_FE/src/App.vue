<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { initTheme } = useTheme()
initTheme()
</script>
