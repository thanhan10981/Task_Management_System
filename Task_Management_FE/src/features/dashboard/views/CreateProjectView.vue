<template>
  <section class="cpv-root">
    <div class="cpv-card">
      <h1 class="cpv-title">Create your first project</h1>
      <p class="cpv-desc">
        A project is required before you can work with files, tasks, and boards.
      </p>

      <form class="cpv-form" @submit.prevent="submit">
        <div class="cpv-field">
          <label class="cpv-label" for="project-name">Project name</label>
          <input
            id="project-name"
            v-model.trim="form.name"
            type="text"
            class="cpv-input"
            placeholder="Example: Mobile App Revamp"
            required
            maxlength="180"
          >
        </div>

        <div class="cpv-field">
          <label class="cpv-label" for="project-description">Description</label>
          <textarea
            id="project-description"
            v-model.trim="form.description"
            rows="4"
            class="cpv-input cpv-textarea"
            placeholder="Short project summary"
            maxlength="1000"
          />
        </div>

        <p v-if="errorMessage" class="cpv-error">
          {{ errorMessage }}
        </p>

        <div class="cpv-actions">
          <button
            type="submit"
            class="cpv-btn-submit"
            :disabled="loading || !form.name"
          >
            <svg v-if="loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cpv-spin">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
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

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */
.cpv-root {
  display: flex;
  justify-content: center;
  padding: 24px 16px 48px;
  min-height: 60vh;
  align-items: flex-start;
}

/* ── Card ──────────────────────────────────────────────────────────────────── */
.cpv-card {
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  padding: 36px 40px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
}
@media (max-width: 640px) { .cpv-card { padding: 24px 20px; border-radius: 16px; } }
@media (max-width: 400px) { .cpv-card { padding: 20px 16px; } }

.cpv-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}
@media (max-width: 480px) { .cpv-title { font-size: 1.125rem; } }

.cpv-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* ── Form ──────────────────────────────────────────────────────────────────── */
.cpv-form {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cpv-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cpv-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}

.cpv-input {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 0.875rem;
  color: #1e293b;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  font-family: inherit;
}
.cpv-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.cpv-textarea { resize: vertical; min-height: 100px; }

/* ── Error ──────────────────────────────────────────────────────────────────── */
.cpv-error {
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  padding: 10px 14px;
  font-size: 0.8125rem;
  color: #ef4444;
  margin: 0;
}

/* ── Actions ────────────────────────────────────────────────────────────────── */
.cpv-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
@media (max-width: 480px) {
  .cpv-actions { justify-content: stretch; }
  .cpv-btn-submit { width: 100%; }
}

.cpv-btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  transition: opacity 0.18s, transform 0.15s;
}
.cpv-btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.cpv-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

.cpv-spin { animation: cpv-spin 0.9s linear infinite; }
@keyframes cpv-spin { to { transform: rotate(360deg); } }
</style>
