<template>
  <section class="mx-auto max-w-2xl">
    <div class="card p-6 md:p-8">
      <h1 class="text-2xl font-bold text-secondary-900">Create your first project</h1>
      <p class="mt-2 text-sm text-secondary-500">
        A project is required before you can work with files, tasks, and boards.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium text-secondary-700" for="project-name">Project name</label>
          <input
            id="project-name"
            v-model.trim="form.name"
            type="text"
            class="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="Example: Mobile App Revamp"
            required
            maxlength="180"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-secondary-700" for="project-description">Description</label>
          <textarea
            id="project-description"
            v-model.trim="form.description"
            rows="4"
            class="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="Short project summary"
            maxlength="1000"
          />
        </div>

        <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading || !form.name"
          >
            {{ loading ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project.store'

const router = useRouter()
const projectStore = useProjectStore()

const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  name: '',
  description: '',
})

async function submit() {
  if (!form.name) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const createdProject = await projectStore.createAndSelectProject({
      name: form.name,
      description: form.description || undefined,
    })

    if (createdProject?.id) {
      await router.push({ name: 'dashboard' })
      return
    }

    await router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = extractErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function extractErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const payload = (error as { response?: { data?: unknown } }).response?.data
    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message
      if (typeof message === 'string') {
        return message
      }

      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') {
        return nested
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to create project'
}
</script>
