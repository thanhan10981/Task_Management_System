<template>
  <section class="admin-page">
    <div class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Search projects or owners" @keyup.enter="loadProjects">
      <select v-model="status">
        <option value="">All statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="ARCHIVED">ARCHIVED</option>
        <option value="COMPLETED">COMPLETED</option>
      </select>
      <button type="button" @click="page = 1; loadProjects()">Apply</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Project</th><th>Owner</th><th>Status</th><th>Tasks</th><th>Members</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td><strong>{{ project.name }}</strong><span>{{ project.description || 'No description' }}</span></td>
            <td>{{ project.creator?.email || '-' }}</td>
            <td>
              <select :value="project.status" @change="changeStatus(project, ($event.target as HTMLSelectElement).value as AdminProjectStatus)">
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </td>
            <td>{{ project._count?.tasks ?? 0 }}</td>
            <td>{{ project._count?.members ?? 0 }}</td>
            <td><button type="button" class="danger" @click="removeProject(project)">Delete</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading || projects.length === 0" class="empty">{{ loading ? 'Loading projects...' : 'No projects found.' }}</p>
    </div>
    <div class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; loadProjects()">Prev</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages || 1 }}</span>
      <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadProjects()">Next</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  deleteAdminProject,
  getAdminProjects,
  updateAdminProjectStatus,
  type AdminPaginationMeta,
  type AdminProject,
  type AdminProjectStatus,
} from '@/api/admin'

const projects = ref<AdminProject[]>([])
const search = ref('')
const status = ref<AdminProjectStatus | ''>('')
const page = ref(1)
const loading = ref(false)
const error = ref('')
const meta = reactive<AdminPaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })

async function loadProjects() {
  loading.value = true
  error.value = ''
  try {
    const response = await getAdminProjects({ search: search.value || undefined, status: status.value, page: page.value, limit: 20 })
    projects.value = response.data
    Object.assign(meta, response.meta)
  } catch {
    error.value = 'Failed to load projects.'
  } finally {
    loading.value = false
  }
}

async function changeStatus(project: AdminProject, next: AdminProjectStatus) {
  if (project.status === next) return
  if (!window.confirm(`Change project "${project.name}" status to ${next}?`)) {
    await loadProjects()
    return
  }
  try {
    Object.assign(project, await updateAdminProjectStatus(project.id, next))
  } catch {
    error.value = 'Failed to update project status.'
    await loadProjects()
  }
}

async function removeProject(project: AdminProject) {
  if (!window.confirm(`Delete project "${project.name}"? This can remove related project data.`)) return
  try {
    await deleteAdminProject(project.id)
    await loadProjects()
  } catch {
    error.value = 'Failed to delete project.'
  }
}

onMounted(loadProjects)
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
table { width: 100%; min-width: 880px; border-collapse: collapse; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; }
th { color: #64748b; font-size: 12px; text-transform: uppercase; }
td strong, td span { display: block; }
td span { color: #64748b; margin-top: 2px; max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty, .error { padding: 14px; color: #64748b; }
.error { color: #dc2626; font-weight: 800; }
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 10px; color: #64748b; }
@media (max-width: 640px) { .toolbar { flex-direction: column; } .pager { justify-content: space-between; } }
</style>
