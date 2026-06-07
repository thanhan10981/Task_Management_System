<template>
  <section class="admin-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model.trim="search" type="search" placeholder="Search tasks or projects…" @keyup.enter="page = 1; loadTasks()" />
      </div>
      <select v-model="priority" class="filter-select">
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>
      <button type="button" class="btn-primary" @click="page = 1; loadTasks()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
        Apply
      </button>
    </div>

    <!-- Error banner -->
    <Transition name="err-slide">
      <div v-if="error" class="error-banner" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
      </div>
    </Transition>

    <!-- Data card -->
    <div class="data-card">
      <!-- Skeleton -->
      <template v-if="loading && tasks.length === 0">
        <div class="skeleton-header">
          <div class="skeleton" v-for="i in 6" :key="i" :style="`width: ${[120, 90, 70, 60, 80, 70][i-1]}px; height: 12px`"></div>
        </div>
        <div v-for="i in 8" :key="i" class="skeleton-row">
          <div class="skeleton-task-cell">
            <div class="skeleton" style="width:150px;height:13px;margin-bottom:6px"></div>
            <div class="skeleton" style="width:200px;height:11px"></div>
          </div>
          <div class="skeleton" style="width:90px;height:13px"></div>
          <div class="skeleton" style="width:80px;height:22px;border-radius:6px"></div>
          <div class="skeleton" style="width:60px;height:22px;border-radius:6px"></div>
          <div class="skeleton" style="width:100px;height:13px"></div>
          <div class="skeleton-actions">
            <div class="skeleton" style="width:48px;height:28px;border-radius:7px"></div>
            <div class="skeleton" style="width:60px;height:28px;border-radius:7px"></div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="!loading && tasks.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3>No tasks found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>
                <div>
                  <strong class="task-title">{{ task.title }}</strong>
                  <span class="task-desc">{{ task.description || 'No description' }}</span>
                </div>
              </td>
              <td>
                <div class="project-chip" v-if="task.project?.name">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  {{ task.project.name }}
                </div>
                <span v-else class="td-muted">-</span>
              </td>
              <td>
                <select
                  :value="task.statusId"
                  class="status-select"
                  @change="changeStatus(task, ($event.target as HTMLSelectElement).value)"
                >
                  <option :value="task.statusId">{{ task.status?.name || 'Current status' }}</option>
                  <option v-for="status in statusOptions(task.projectId)" :key="status.id" :value="status.id">
                    {{ status.name }}
                  </option>
                </select>
              </td>
              <td>
                <span :class="['priority-chip', `priority-chip--${task.priority?.toLowerCase()}`]">{{ task.priority }}</span>
              </td>
              <td>
                <div class="assignee-list" v-if="task.assignees?.length">
                  <div
                    v-for="(assignee, idx) in task.assignees.slice(0, 3)"
                    :key="assignee.user?.email"
                    class="assignee-avatar"
                    :title="assignee.user?.fullName || assignee.user?.email"
                    :style="`z-index: ${10 - idx}`"
                  >
                    {{ (assignee.user?.fullName || assignee.user?.email || '?')[0].toUpperCase() }}
                  </div>
                  <span v-if="task.assignees.length > 3" class="assignee-more">+{{ task.assignees.length - 3 }}</span>
                </div>
                <span v-else class="td-muted">-</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button type="button" class="btn-view" @click="selected = task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </button>
                  <button type="button" class="btn-danger-sm" @click="removeTask(task)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading && tasks.length > 0" class="loading-overlay">
        <span class="spinner"></span>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pager">
      <span class="pager-info">Showing {{ tasks.length }} of {{ meta.total }} tasks</span>
      <div class="pager-controls">
        <button type="button" :disabled="page <= 1" @click="page--; loadTasks()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pager-page">{{ meta.page }} / {{ meta.totalPages || 1 }}</span>
        <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadTasks()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Task detail modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selected" class="modal-backdrop" @click="selected = null">
          <article class="modal" @click.stop>
            <div class="modal-header">
              <div>
                <span :class="['priority-chip', `priority-chip--${selected.priority?.toLowerCase()}`]">{{ selected.priority }}</span>
                <h2>{{ selected.title }}</h2>
              </div>
              <button class="modal-close" type="button" @click="selected = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p class="modal-desc">{{ selected.description || 'No description provided.' }}</p>
            <div class="modal-grid">
              <div class="modal-field">
                <span class="field-label">Project</span>
                <span class="field-value">{{ selected.project?.name || '-' }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Status</span>
                <span class="field-value">{{ selected.status?.name || '-' }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Priority</span>
                <span class="field-value">{{ selected.priority }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Assignees</span>
                <span class="field-value">{{ assigneeLabel(selected) }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Created by</span>
                <span class="field-value">{{ selected.createdByUser?.email || '-' }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Due date</span>
                <span class="field-value">{{ selected.dueDate ? formatDate(selected.dueDate) : '-' }}</span>
              </div>
            </div>
            <button type="button" class="btn-close-modal" @click="selected = null">Close</button>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deleteAdminTask,
  getAdminTasks,
  updateAdminTaskStatus,
  type AdminPaginationMeta,
  type AdminTask,
  type AdminTaskPriority,
  type AdminTaskStatus,
} from '@/api/admin'

const tasks = ref<AdminTask[]>([])
const selected = ref<AdminTask | null>(null)
const search = ref('')
const priority = ref<AdminTaskPriority | ''>('')
const page = ref(1)
const loading = ref(false)
const error = ref('')
const meta = reactive<AdminPaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })

const knownStatuses = computed(() => {
  const map = new Map<string, AdminTaskStatus & { projectId: string }>()
  for (const task of tasks.value) {
    if (task.status && !map.has(task.status.id)) {
      map.set(task.status.id, { ...task.status, projectId: task.projectId })
    }
  }
  return Array.from(map.values())
})

function statusOptions(projectId: string) {
  return knownStatuses.value.filter((status) => status.projectId === projectId)
}

async function loadTasks() {
  loading.value = true
  error.value = ''
  try {
    const response = await getAdminTasks({ search: search.value || undefined, priority: priority.value, page: page.value, limit: 20 })
    tasks.value = response.data
    Object.assign(meta, response.meta)
  } catch {
    error.value = 'Failed to load tasks.'
  } finally {
    loading.value = false
  }
}

async function changeStatus(task: AdminTask, statusId: string) {
  if (task.statusId === statusId) return
  const status = knownStatuses.value.find((item) => item.id === statusId)
  if (!window.confirm(`Change "${task.title}" status to ${status?.name || 'selected status'}?`)) {
    await loadTasks()
    return
  }
  try {
    Object.assign(task, await updateAdminTaskStatus(task.id, statusId))
  } catch {
    error.value = 'Failed to update task status.'
    await loadTasks()
  }
}

async function removeTask(task: AdminTask) {
  if (!window.confirm(`Delete task "${task.title}"?`)) return
  try {
    await deleteAdminTask(task.id)
    await loadTasks()
  } catch {
    error.value = 'Failed to delete task.'
  }
}

function assigneeLabel(task: AdminTask) {
  const names = task.assignees?.map((item) => item.user.fullName || item.user.email).filter(Boolean) ?? []
  return names.length ? names.join(', ') : '-'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadTasks)
</script>

<style scoped>
.admin-page { display: grid; gap: 16px; }

/* ─── Toolbar ────────────────────────────────────────── */
.page-toolbar { display: flex; gap: 10px; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 0; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; pointer-events: none; }
input[type="search"] {
  width: 100%; height: 42px; padding: 0 12px 0 38px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff; font-size: 14px; color: #1e293b;
  outline: none; box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}
input[type="search"]:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
.filter-select { height: 42px; padding: 0 12px; min-width: 150px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 14px; color: #1e293b; outline: none; cursor: pointer; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 42px; padding: 0 18px; background: #6366f1; color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap; transition: background 0.18s, transform 0.15s; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
.btn-primary svg { width: 14px; height: 14px; }

/* ─── Error ──────────────────────────────────────────── */
.error-banner { display: flex; align-items: center; gap: 8px; padding: 11px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 600; }
.error-banner svg { width: 16px; height: 16px; flex-shrink: 0; }
.err-slide-enter-active, .err-slide-leave-active { transition: all 0.2s ease; }
.err-slide-enter-from, .err-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── Data card ──────────────────────────────────────── */
.data-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); position: relative; min-height: 200px; }

/* ─── Skeleton ───────────────────────────────────────── */
.skeleton { background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 400% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.skeleton-header { display: flex; gap: 50px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
.skeleton-row { display: flex; align-items: center; gap: 50px; padding: 16px 18px; border-bottom: 1px solid #f8fafc; }
.skeleton-task-cell { flex: 1; }
.skeleton-actions { display: flex; gap: 8px; }

/* ─── Empty ──────────────────────────────────────────── */
.empty-state { padding: 64px 20px; text-align: center; }
.empty-icon { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; display: grid; place-items: center; margin: 0 auto 16px; }
.empty-icon svg { width: 32px; height: 32px; color: #94a3b8; }
.empty-state h3 { margin: 0 0 6px; font-size: 16px; color: #334155; }
.empty-state p { margin: 0; color: #64748b; font-size: 14px; }

/* ─── Table ──────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 940px; }
th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #334155; vertical-align: middle; }
tbody tr { transition: background 0.15s; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #f8fafc; }
.td-muted { color: #94a3b8; font-size: 12px; }
.task-title { display: block; font-weight: 700; color: #1e293b; }
.task-desc { display: block; font-size: 12px; color: #64748b; margin-top: 2px; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ─── Project chip ───────────────────────────────────── */
.project-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: #f1f5f9; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; }
.project-chip svg { width: 11px; height: 11px; }

/* ─── Status select ──────────────────────────────────── */
.status-select { height: 30px; padding: 0 8px; border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; font-size: 12px; font-weight: 600; color: #334155; outline: none; cursor: pointer; transition: border-color 0.15s; }
.status-select:focus { border-color: #6366f1; }

/* ─── Priority chip ──────────────────────────────────── */
.priority-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.priority-chip--low { background: #f0fdf4; color: #16a34a; }
.priority-chip--medium { background: #fffbeb; color: #b45309; }
.priority-chip--high { background: #fff7ed; color: #c2410c; }
.priority-chip--urgent { background: #fef2f2; color: #dc2626; }

/* ─── Assignees ──────────────────────────────────────── */
.assignee-list { display: flex; align-items: center; }
.assignee-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 10px; font-weight: 800; display: grid; place-items: center; border: 2px solid #fff; margin-left: -6px; position: relative; }
.assignee-list .assignee-avatar:first-child { margin-left: 0; }
.assignee-more { font-size: 11px; font-weight: 700; color: #64748b; margin-left: 4px; }

/* ─── Action buttons ─────────────────────────────────── */
.action-buttons { display: flex; gap: 6px; }
.btn-view { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.btn-view:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.btn-view svg { width: 12px; height: 12px; }
.btn-danger-sm { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.btn-danger-sm:hover { background: #fee2e2; border-color: #fca5a5; }
.btn-danger-sm svg { width: 12px; height: 12px; }

/* ─── Loading overlay ────────────────────────────────── */
.loading-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.7); display: grid; place-items: center; backdrop-filter: blur(2px); }
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Pager ──────────────────────────────────────────── */
.pager { display: flex; align-items: center; justify-content: space-between; }
.pager-info { font-size: 13px; color: #94a3b8; }
.pager-controls { display: flex; align-items: center; gap: 8px; }
.pager-page { font-size: 13px; font-weight: 700; color: #334155; padding: 0 4px; }
.pager-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #475569; display: grid; place-items: center; cursor: pointer; transition: all 0.15s; }
.pager-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pager-btn svg { width: 15px; height: 15px; }

/* ─── Modal ──────────────────────────────────────────── */
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); z-index: 200; }
.modal { width: min(100%, 520px); background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 32px 80px rgba(15, 23, 42, 0.3); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px 24px 0; }
.modal-header h2 { margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #0f172a; }
.modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; transition: all 0.15s; }
.modal-close:hover { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
.modal-close svg { width: 14px; height: 14px; }
.modal-desc { margin: 12px 24px 20px; color: #64748b; font-size: 14px; line-height: 1.6; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #f1f5f9; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
.modal-field { background: #fff; padding: 14px 24px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
.field-value { display: block; font-size: 13px; font-weight: 600; color: #1e293b; }
.btn-close-modal { display: block; width: calc(100% - 48px); margin: 20px 24px; height: 42px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.btn-close-modal:hover { background: #eef2ff; border-color: #6366f1; color: #6366f1; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.22s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal, .modal-fade-leave-to .modal { transform: scale(0.95) translateY(10px); }
.modal-fade-enter-active .modal, .modal-fade-leave-active .modal { transition: transform 0.22s ease; }

@media (max-width: 640px) {
  .page-toolbar { flex-direction: column; }
  .btn-primary, .filter-select { width: 100%; }
  .pager { flex-direction: column; gap: 10px; }
  .modal-grid { grid-template-columns: 1fr; }
}
</style>
