<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-secondary-900">Dashboard</h2>
      <p class="mt-1 text-sm text-secondary-500">Manage your workspace and project context from one place.</p>
    </div>

    <div v-if="!currentProjectId" class="card p-6 space-y-3">
      <div>
        <h3 class="text-lg font-semibold text-secondary-900">No Data</h3>
        <p class="mt-1 text-sm text-secondary-500">
          Please select a project from the header dropdown to access tasks, timeline, and files.
        </p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card text-center">
        <p class="text-4xl font-bold text-primary-600">0</p>
        <p class="text-sm text-secondary-500 mt-1">Total Tasks</p>
      </div>
      <div class="card text-center">
        <p class="text-4xl font-bold text-blue-600">0</p>
        <p class="text-sm text-secondary-500 mt-1">In Progress</p>
      </div>
      <div class="card text-center">
        <p class="text-4xl font-bold text-green-600">0</p>
        <p class="text-sm text-secondary-500 mt-1">Completed</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project.store'

const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)
</script>
