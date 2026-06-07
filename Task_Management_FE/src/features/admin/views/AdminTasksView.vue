<template>
  <section class="admin-page">
    <div class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Search tasks or projects" @keyup.enter="page = 1; loadTasks()">
      <select v-model="priority">
        <option value="">All priorities</option>
        <option value="LOW">LOW</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HIGH">HIGH</option>
        <option value="URGENT">URGENT</option>
      </select>
      <button type="button" @click="page = 1; loadTasks()">Apply</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignees</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td><strong>{{ task.title }}</strong><span>{{ task.description || 'No description' }}</span></td>
            <td>{{ task.project?.name || '-' }}</td>
            <td>
              <select :value="task.statusId" @change="changeStatus(task, ($event.target as HTMLSelectElement).value)">
                <option :value="task.statusId">{{ task.status?.name || 'Current status' }}</option>
                <option v-for="status in statusOptions(task.projectId)" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
            </td>
            <td>{{ task.priority }}</td>
            <td>{{ assigneeLabel(task) }}</td>
            <td>
              <button type="button" @click="selected = task">View</button>
              <button type="button" class="danger" @click="removeTask(task)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading || tasks.length === 0" class="empty">{{ loading ? 'Loading tasks...' : 'No tasks found.' }}</p>
    </div>

    <div class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; loadTasks()">Prev</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages || 1 }}</span>
      <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadTasks()">Next</button>
    </div>

    <div v-if="selected" class="modal-backdrop" @click="selected = null">
      <article class="modal" @click.stop>
        <h2>{{ selected.title }}</h2>
        <p>{{ selected.description || 'No description' }}</p>
        <dl>
          <dt>Project</dt><dd>{{ selected.project?.name || '-' }}</dd>
          <dt>Status</dt><dd>{{ selected.status?.name || '-' }}</dd>
          <dt>Priority</dt><dd>{{ selected.priority }}</dd>
          <dt>Assignees</dt><dd>{{ assigneeLabel(selected) }}</dd>
          <dt>Created by</dt><dd>{{ selected.createdByUser?.email || '-' }}</dd>
          <dt>Due date</dt><dd>{{ selected.dueDate ? formatDate(selected.dueDate) : '-' }}</dd>
        </dl>
        <button type="button" @click="selected = null">Close</button>
      </article>
    </div>
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
  return new Date(value).toLocaleString()
}

onMounted(loadTasks)
</script>

<style scoped>
.admin-page { display: grid; gap: 14px; }
.toolbar { display: flex; gap: 10px; }
input, select { height: 38px; border: 1px solid #dbe3ef; border-radius: 8px; padding: 0 10px; background: #fff; }
input { flex: 1; min-width: 0; }
button { border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; padding: 8px 10px; font-weight: 800; cursor: pointer; }
button.danger { color: #dc2626; }
button:disabled { opacity: .5; cursor: not-allowed; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 980px; border-collapse: collapse; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; }
th { color: #64748b; font-size: 12px; text-transform: uppercase; }
td strong, td span { display: block; }
td span { color: #64748b; margin-top: 2px; max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty, .error { padding: 14px; color: #64748b; }
.error { color: #dc2626; font-weight: 800; }
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 10px; color: #64748b; }
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(15,23,42,.45); z-index: 100; }
.modal { width: min(100%, 560px); background: #fff; border-radius: 10px; padding: 20px; }
.modal h2 { margin: 0 0 6px; }
.modal p { color: #475569; }
dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px; }
dt { color: #64748b; font-weight: 800; }
@media (max-width: 640px) { .toolbar { flex-direction: column; } .pager { justify-content: space-between; } }
</style>
