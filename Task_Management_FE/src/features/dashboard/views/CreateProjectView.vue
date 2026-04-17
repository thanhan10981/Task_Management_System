<template>
  <section class="flex justify-center items-start min-h-[60vh] px-4 pt-6 pb-12">
    <div class="w-full max-w-[600px] bg-white rounded-[20px] border border-slate-100 px-10 py-9 shadow-[0_2px_16px_rgba(0,0,0,0.05)] max-sm:px-5 max-sm:py-6 max-sm:rounded-2xl max-[400px]:px-4 max-[400px]:py-5">
      <h1 class="text-[1.375rem] font-bold text-slate-800 mb-2 max-[480px]:text-lg">Create your first project</h1>
      <p class="text-sm text-slate-500 leading-relaxed m-0">
        A project is required before you can work with files, tasks, and boards.
      </p>

      <form class="mt-6 flex flex-col gap-[18px]" @submit.prevent="submit">
        <!-- Project name -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.8125rem] font-semibold text-slate-600" for="project-name">Project name</label>
          <input
            id="project-name"
            v-model.trim="form.name"
            type="text"
            class="cpv-input w-full border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-[11px] text-sm text-slate-800 outline-none transition-all duration-[180ms] font-[inherit]"
            placeholder="Example: Mobile App Revamp"
            required
            maxlength="180"
          >
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.8125rem] font-semibold text-slate-600" for="project-description">Description</label>
          <textarea
            id="project-description"
            v-model.trim="form.description"
            rows="4"
            class="cpv-input w-full border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-[11px] text-sm text-slate-800 outline-none transition-all duration-[180ms] font-[inherit] resize-y min-h-[100px]"
            placeholder="Short project summary"
            maxlength="1000"
          />
        </div>

        <!-- Error -->
        <p v-if="errorMessage" class="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8125rem] text-red-500 m-0">
          {{ errorMessage }}
        </p>

        <!-- Actions -->
        <div class="flex justify-end pt-1 max-[480px]:justify-stretch">
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 px-7 py-[11px] rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-semibold border-none cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all duration-[180ms] disabled:opacity-55 disabled:cursor-not-allowed max-[480px]:w-full hover:not-disabled:opacity-[0.88] hover:not-disabled:-translate-y-px"
            :disabled="loading || !form.name"
          >
            <svg v-if="loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cpv-spin">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            </svg>
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
  if (!form.name) return

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
      if (typeof message === 'string') return message
      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') return nested
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Failed to create project'
}
</script>

<style scoped>
/* Focus ring dùng CSS variable — không thể làm với Tailwind thuần */
.cpv-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* @keyframes không thể inline với Tailwind */
.cpv-spin { animation: cpv-spin 0.9s linear infinite; }
@keyframes cpv-spin { to { transform: rotate(360deg); } }
</style>
