<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-secondary-900">Tasks</h2>
      <button class="btn-primary">+ New Task</button>
    </div>

    <div v-if="isLoading" class="text-secondary-500">Loading tasks…</div>
    <div v-else-if="isError" class="text-red-600">Failed to load tasks. Please try again.</div>
    <div v-else-if="data" class="space-y-3">
      <div
        v-for="task in data.data"
        :key="task.id"
        class="card hover:shadow-md transition-shadow cursor-pointer"
        @click="openTask(task.id)"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-secondary-900">{{ task.title }}</h3>
          <span
            class="text-xs px-2 py-1 rounded-full font-medium"
            :class="{
              'bg-yellow-100 text-yellow-700': task.status === 'todo',
              'bg-blue-100 text-blue-700': task.status === 'in_progress',
              'bg-green-100 text-green-700': task.status === 'done',
              'bg-secondary-100 text-secondary-500': task.status === 'cancelled',
            }"
          >
            {{ task.status.replace('_', ' ') }}
          </span>
        </div>
        <p v-if="task.description" class="mt-1 text-sm text-secondary-500 truncate">
          {{ task.description }}
        </p>
      </div>
    </div>

    <div v-if="data && data.data.length === 0" class="text-center py-12 text-secondary-400">
      No tasks found. Create your first task!
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project.store'
import { storeToRefs } from 'pinia'
import { useTasksQuery } from '../composables/useTasksQuery'

const router = useRouter()
const projectStore = useProjectStore()
const { currentProjectId } = storeToRefs(projectStore)
const taskQueryParams = computed(() =>
  currentProjectId.value ? { projectId: currentProjectId.value } : {}
)
const { data, isLoading, isError } = useTasksQuery(taskQueryParams, {
  enabled: computed(() => Boolean(currentProjectId.value)),
})

function openTask(taskId: string) {
  if (!currentProjectId.value) return

  void router.push({
    name: 'task-detail',
    params: { id: taskId },
  })
}
</script>
