<template>
  <div>
    <div v-if="isLoading" class="text-secondary-500">Loading task…</div>
    <div v-else-if="isError" class="text-red-600">Task not found or failed to load.</div>
    <div v-else-if="data" class="card max-w-2xl">
      <h2 class="text-2xl font-bold text-secondary-900 mb-2">{{ data.data.title }}</h2>
      <p v-if="data.data.description" class="text-secondary-600">{{ data.data.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTaskDetailQuery } from '../composables/useTasksQuery'

const route = useRoute()
const taskId = route.params.id as string
const { data, isLoading, isError } = useTaskDetailQuery(taskId)
</script>
