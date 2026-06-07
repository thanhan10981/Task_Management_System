<template>
  <section class="cpv-section">
    <div class="cpv-wrapper">

      <!-- Left panel: context -->
      <aside class="cpv-aside">
        <div class="cpv-aside-inner">
          <div class="cpv-aside-badge">New workspace</div>
          <h2 class="cpv-aside-title">Set up your<br>project in seconds</h2>
          <p class="cpv-aside-desc">Projects are the foundation of your workspace. Everything — boards, tasks, files — lives inside one.</p>

          <ul class="cpv-checklist">
            <li>
              <span class="cpv-check-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Invite teammates at any time</span>
            </li>
            <li>
              <span class="cpv-check-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Kanban &amp; sprint boards included</span>
            </li>
            <li>
              <span class="cpv-check-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Real-time analytics &amp; reminders</span>
            </li>
          </ul>
        </div>

        <!-- Decorative rings -->
        <div class="cpv-ring cpv-ring-1" aria-hidden="true"/>
        <div class="cpv-ring cpv-ring-2" aria-hidden="true"/>
      </aside>

      <!-- Right panel: form -->
      <div class="cpv-form-panel">
        <div class="cpv-form-header">
          <h1 class="cpv-form-title">Create project</h1>
          <p class="cpv-form-subtitle">Give your project a name and an optional description to get started.</p>
        </div>

        <form class="cpv-form" @submit.prevent="submit">
          <!-- Project name -->
          <div class="cpv-field">
            <div class="cpv-label-row">
              <label class="cpv-label" for="project-name">Project name <span class="cpv-required">*</span></label>
              <span class="cpv-counter" :class="{ 'cpv-counter--warn': form.name.length > 150 }">{{ form.name.length }}/180</span>
            </div>
            <div class="cpv-input-wrap" :class="{ 'cpv-input-wrap--focus': nameFocused }">
              <svg class="cpv-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>
              <input
                id="project-name"
                v-model.trim="form.name"
                type="text"
                class="cpv-input"
                placeholder="e.g. Mobile App Revamp"
                required
                maxlength="180"
                autocomplete="off"
                @focus="nameFocused = true"
                @blur="nameFocused = false"
              >
            </div>
          </div>

          <!-- Description -->
          <div class="cpv-field">
            <div class="cpv-label-row">
              <label class="cpv-label" for="project-description">Description <span class="cpv-optional">optional</span></label>
              <span class="cpv-counter" :class="{ 'cpv-counter--warn': form.description.length > 900 }">{{ form.description.length }}/1000</span>
            </div>
            <textarea
              id="project-description"
              v-model.trim="form.description"
              rows="4"
              class="cpv-input cpv-textarea"
              :class="{ 'cpv-input--focus': descFocused }"
              placeholder="Short summary of what this project covers…"
              maxlength="1000"
              @focus="descFocused = true"
              @blur="descFocused = false"
            />
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="cpv-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div class="cpv-actions">
            <button
              type="button"
              class="cpv-cancel-btn"
              :disabled="loading"
              @click="router.back()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="gradient-btn cpv-submit-btn"
              :disabled="loading || !form.name"
            >
              <svg v-if="loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="cpv-spin"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ loading ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>

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
const nameFocused = ref(false)
const descFocused = ref(false)
const form = reactive({
  name: '',
  description: '',
})

async function submit() {
  if (!form.name) return
  if (form.name.trim().length < 2) {
    errorMessage.value = 'Project name must be at least 2 characters.'
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
      const errors = (payload as { errors?: Record<string, unknown> }).errors
      const firstError = getFirstValidationError(errors)
      if (firstError) return firstError

      const message = (payload as { message?: unknown }).message
      if (typeof message === 'string') return message
      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') return nested
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Failed to create project'
}

function getFirstValidationError(errors: Record<string, unknown> | undefined) {
  if (!errors) return ''

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      const first = value.find((item): item is string => typeof item === 'string' && item.length > 0)
      if (first) return first
    }

    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return ''
}
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────── */
.cpv-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 80vh;
  padding: 40px 16px 80px;
}

.cpv-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  width: 100%;
  max-width: 820px;
  border-radius: 20px;
  border: 1px solid var(--border-base);
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
}

/* ── Left aside ──────────────────────────────────────────────────── */
.cpv-aside {
  position: relative;
  overflow: hidden;
  padding: 48px 36px;
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18), transparent),
    radial-gradient(ellipse 60% 80% at 100% 100%, rgba(6,182,212,0.10), transparent),
    var(--bg-surface-2);
  border-right: 1px solid var(--border-base);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cpv-aside-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cpv-aside-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #818cf8;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.22);
}

.cpv-aside-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: var(--text-heading);
}

.cpv-aside-desc {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.65;
  color: var(--text-subtle);
  max-width: 260px;
}

.cpv-checklist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cpv-checklist li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.cpv-check-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(99,102,241,0.18);
  color: #a5b4fc;
}

/* Decorative rings */
.cpv-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(99,102,241,0.12);
  pointer-events: none;
}
.cpv-ring-1 {
  width: 280px; height: 280px;
  bottom: -100px; right: -100px;
}
.cpv-ring-2 {
  width: 180px; height: 180px;
  bottom: -40px; right: -40px;
  border-color: rgba(6,182,212,0.10);
}

/* ── Right form panel ────────────────────────────────────────────── */
.cpv-form-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 48px 44px;
  background: var(--bg-surface);
}

.cpv-form-header {
  margin-bottom: 28px;
}

.cpv-form-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-heading);
}

.cpv-form-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-subtle);
  line-height: 1.5;
}

/* ── Form elements ───────────────────────────────────────────────── */
.cpv-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cpv-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cpv-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cpv-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.cpv-required {
  color: #f43f5e;
  margin-left: 1px;
}

.cpv-optional {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-subtle);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-base);
  padding: 1px 7px;
  border-radius: 999px;
  margin-left: 6px;
}

.cpv-counter {
  font-size: 0.7rem;
  color: var(--text-subtle);
  font-variant-numeric: tabular-nums;
  transition: color 0.15s;
}

.cpv-counter--warn {
  color: #f59e0b;
}

/* Input with icon wrapper */
.cpv-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid var(--border-medium);
  border-radius: 10px;
  padding: 0 14px;
  background: var(--bg-surface-2);
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
}

.cpv-input-wrap--focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  background: var(--bg-surface);
}

.cpv-input-icon {
  flex-shrink: 0;
  color: var(--text-subtle);
  pointer-events: none;
}

.cpv-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 11px 0;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.cpv-input::placeholder {
  color: var(--text-subtle);
}

/* Standalone textarea */
.cpv-textarea {
  display: block;
  width: 100%;
  border: 1.5px solid var(--border-medium);
  border-radius: 10px;
  padding: 11px 14px;
  background: var(--bg-surface-2);
  resize: vertical;
  min-height: 104px;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  color: var(--text-primary);
  box-sizing: border-box;
}

.cpv-textarea:focus,
.cpv-input--focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  background: var(--bg-surface) !important;
  outline: none;
}

/* Error */
.cpv-error {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  border: 1px solid rgba(244,63,94,0.30);
  background: rgba(244,63,94,0.08);
  padding: 10px 14px;
  font-size: 0.8125rem;
  color: #f87171;
}

/* ── Actions ─────────────────────────────────────────────────────── */
.cpv-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.cpv-cancel-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.cpv-cancel-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-medium);
}

.cpv-cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cpv-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  font-size: 0.875rem;
}

.cpv-submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Spinner */
.cpv-spin {
  animation: cpv-spin 0.85s linear infinite;
}

@keyframes cpv-spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 720px) {
  .cpv-wrapper {
    grid-template-columns: 1fr;
  }

  .cpv-aside {
    padding: 32px 28px 28px;
    border-right: none;
    border-bottom: 1px solid var(--border-base);
  }

  .cpv-aside-title {
    font-size: 1.3rem;
  }

  .cpv-aside-desc {
    max-width: 100%;
  }

  .cpv-form-panel {
    padding: 32px 28px 36px;
  }
}

@media (max-width: 480px) {
  .cpv-section {
    padding: 24px 12px 60px;
  }

  .cpv-wrapper {
    border-radius: 16px;
  }

  .cpv-aside {
    padding: 28px 20px;
  }

  .cpv-form-panel {
    padding: 28px 20px 32px;
  }

  .cpv-actions {
    flex-direction: column-reverse;
  }

  .cpv-cancel-btn,
  .cpv-submit-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
