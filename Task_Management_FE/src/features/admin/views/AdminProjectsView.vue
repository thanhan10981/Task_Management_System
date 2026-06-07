<template>
  <section class="admin-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model.trim="search" type="search" placeholder="Search projects or owners…" @keyup.enter="page = 1; loadProjects()" />
      </div>
      <select v-model="status" class="filter-select">
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="ARCHIVED">Archived</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <button type="button" class="btn-primary" @click="page = 1; loadProjects()">
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
      <template v-if="loading && projects.length === 0">
        <div class="skeleton-header">
          <div class="skeleton" v-for="i in 6" :key="i" :style="`width: ${[120, 100, 70, 50, 60, 60][i-1]}px; height: 12px`"></div>
        </div>
        <div v-for="i in 7" :key="i" class="skeleton-row">
          <div class="skeleton-project-cell">
            <div class="skeleton skeleton-folder"></div>
            <div>
              <div class="skeleton" style="width:130px;height:13px;margin-bottom:6px"></div>
              <div class="skeleton" style="width:200px;height:11px"></div>
            </div>
          </div>
          <div class="skeleton" style="width:120px;height:13px"></div>
          <div class="skeleton" style="width:70px;height:22px;border-radius:6px"></div>
          <div class="skeleton" style="width:30px;height:13px"></div>
          <div class="skeleton" style="width:30px;height:13px"></div>
          <div class="skeleton" style="width:70px;height:28px;border-radius:7px"></div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="!loading && projects.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <h3>No projects found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Tasks</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.id">
              <td>
                <div class="project-cell">
                  <div class="project-avatar">{{ project.name[0].toUpperCase() }}</div>
                  <div>
                    <strong>{{ project.name }}</strong>
                    <span>{{ project.description || 'No description' }}</span>
                  </div>
                </div>
              </td>
              <td class="td-muted">{{ project.creator?.email || '-' }}</td>
              <td>
                <select
                  :value="project.status"
                  class="status-select"
                  @change="changeStatus(project, ($event.target as HTMLSelectElement).value as AdminProjectStatus)"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </td>
              <td>
                <div class="count-cell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  {{ project._count?.tasks ?? 0 }}
                </div>
              </td>
              <td>
                <div class="count-cell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ project._count?.members ?? 0 }}
                </div>
              </td>
              <td>
                <button type="button" class="btn-danger-sm" @click="removeProject(project)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading && projects.length > 0" class="loading-overlay">
        <span class="spinner"></span>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pager">
      <span class="pager-info">Showing {{ projects.length }} of {{ meta.total }} projects</span>
      <div class="pager-controls">
        <button type="button" :disabled="page <= 1" @click="page--; loadProjects()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pager-page">{{ meta.page }} / {{ meta.totalPages || 1 }}</span>
        <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadProjects()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
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
.filter-select {
  height: 42px; padding: 0 12px; min-width: 150px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff; font-size: 14px; color: #1e293b;
  outline: none; cursor: pointer;
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  height: 42px; padding: 0 18px;
  background: #6366f1; color: #fff; border: none; border-radius: 10px;
  font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap;
  transition: background 0.18s, transform 0.15s;
}
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
.skeleton-header { display: flex; gap: 60px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
.skeleton-row { display: flex; align-items: center; gap: 60px; padding: 16px 18px; border-bottom: 1px solid #f8fafc; }
.skeleton-project-cell { display: flex; align-items: center; gap: 10px; flex: 1; }
.skeleton-folder { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }

/* ─── Empty ──────────────────────────────────────────── */
.empty-state { padding: 64px 20px; text-align: center; }
.empty-icon { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; display: grid; place-items: center; margin: 0 auto 16px; }
.empty-icon svg { width: 32px; height: 32px; color: #94a3b8; }
.empty-state h3 { margin: 0 0 6px; font-size: 16px; color: #334155; }
.empty-state p { margin: 0; color: #64748b; font-size: 14px; }

/* ─── Table ──────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 860px; }
th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #334155; vertical-align: middle; }
tbody tr { transition: background 0.15s; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #f8fafc; }
.td-muted { color: #94a3b8; font-size: 12px; }

/* ─── Cells ──────────────────────────────────────────── */
.project-cell { display: flex; align-items: center; gap: 10px; }
.project-avatar { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; font-size: 15px; font-weight: 800; display: grid; place-items: center; flex-shrink: 0; }
.project-cell strong { display: block; font-weight: 700; color: #1e293b; }
.project-cell span { display: block; font-size: 12px; color: #64748b; margin-top: 1px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count-cell { display: flex; align-items: center; gap: 5px; color: #334155; font-weight: 600; }
.count-cell svg { width: 13px; height: 13px; color: #94a3b8; }

/* ─── Status select ──────────────────────────────────── */
.status-select {
  height: 30px; padding: 0 8px;
  border: 1px solid #e2e8f0; border-radius: 7px;
  background: #f8fafc; font-size: 12px; font-weight: 600; color: #334155;
  outline: none; cursor: pointer;
  transition: border-color 0.15s;
}
.status-select:focus { border-color: #6366f1; }

/* ─── Delete button ──────────────────────────────────── */
.btn-danger-sm {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 8px;
  border: 1px solid #fecaca; background: #fef2f2; color: #dc2626;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.15s;
}
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

@media (max-width: 640px) {
  .page-toolbar { flex-direction: column; }
  .btn-primary, .filter-select { width: 100%; }
  .pager { flex-direction: column; gap: 10px; }
}
</style>
