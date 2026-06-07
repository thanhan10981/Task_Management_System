<template>
  <section class="admin-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model.trim="search"
          type="search"
          placeholder="Search by name, email, phone, job title…"
          @keyup.enter="page = 1; loadUsers()"
        />
      </div>
      <button type="button" class="btn-primary" @click="page = 1; loadUsers()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search
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
      <template v-if="loading && users.length === 0">
        <div class="skeleton-header">
          <div class="skeleton" v-for="i in 6" :key="i" :style="`width: ${[120, 60, 60, 80, 70, 80][i-1]}px; height: 12px`"></div>
        </div>
        <div v-for="i in 8" :key="i" class="skeleton-row">
          <div class="skeleton-user-cell">
            <div class="skeleton skeleton-avatar-circle"></div>
            <div>
              <div class="skeleton" style="width:130px;height:13px;margin-bottom:6px"></div>
              <div class="skeleton" style="width:170px;height:11px"></div>
            </div>
          </div>
          <div class="skeleton" style="width:60px;height:22px;border-radius:6px"></div>
          <div class="skeleton" style="width:60px;height:22px;border-radius:20px"></div>
          <div class="skeleton" style="width:80px;height:13px"></div>
          <div class="skeleton" style="width:70px;height:13px"></div>
          <div class="skeleton-actions">
            <div class="skeleton" style="width:48px;height:28px;border-radius:7px"></div>
            <div class="skeleton" style="width:58px;height:28px;border-radius:7px"></div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="!loading && users.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3>No users found</h3>
        <p>Try adjusting your search query.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Projects</th>
              <th>Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" :class="user.isActive === false ? 'user-avatar--inactive' : ''">
                    {{ (user.fullName || user.email || 'U')[0].toUpperCase() }}
                  </div>
                  <div>
                    <strong>{{ user.fullName }}</strong>
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <select
                  :value="user.role || 'USER'"
                  class="role-select"
                  :class="(user.role || 'USER') === 'ADMIN' ? 'role-select--admin' : ''"
                  @change="changeRole(user, ($event.target as HTMLSelectElement).value as 'USER' | 'ADMIN')"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>
                <span :class="['status-badge', user.isActive === false ? 'status-badge--off' : 'status-badge--on']">
                  <span class="status-dot"></span>
                  {{ user.isActive === false ? 'Inactive' : 'Active' }}
                </span>
              </td>
              <td>
                <div class="stat-cell">
                  <span class="stat-owned">{{ user._count?.projectsCreated ?? 0 }} owned</span>
                  <span class="stat-sep">·</span>
                  <span class="stat-member">{{ user._count?.projectMembers ?? 0 }} member</span>
                </div>
              </td>
              <td class="td-muted">{{ user._count?.tasksCreated ?? 0 }} created</td>
              <td>
                <div class="action-buttons">
                  <button type="button" class="btn-view" @click="selected = user">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </button>
                  <button
                    type="button"
                    :class="['btn-toggle', user.isActive === false ? 'btn-toggle--unlock' : 'btn-toggle--lock']"
                    @click="toggleStatus(user)"
                  >
                    <svg v-if="user.isActive !== false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    {{ user.isActive === false ? 'Unlock' : 'Lock' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading && users.length > 0" class="loading-overlay">
        <span class="spinner"></span>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pager">
      <span class="pager-info">Showing {{ users.length }} of {{ meta.total }} users</span>
      <div class="pager-controls">
        <button type="button" :disabled="page <= 1" @click="page--; loadUsers()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pager-page">{{ meta.page }} / {{ meta.totalPages || 1 }}</span>
        <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadUsers()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- User detail modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selected" class="modal-backdrop" @click="selected = null">
          <article class="modal" @click.stop>
            <div class="modal-header">
              <div class="modal-user-head">
                <div class="modal-avatar" :class="selected.isActive === false ? 'modal-avatar--inactive' : ''">
                  {{ (selected.fullName || selected.email || 'U')[0].toUpperCase() }}
                </div>
                <div>
                  <h2>{{ selected.fullName }}</h2>
                  <p>{{ selected.email }}</p>
                </div>
              </div>
              <button class="modal-close" type="button" @click="selected = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-badges">
              <span :class="['role-badge-pill', (selected.role || 'USER') === 'ADMIN' ? 'role-badge-pill--admin' : '']">
                {{ selected.role || 'USER' }}
              </span>
              <span :class="['status-badge', selected.isActive === false ? 'status-badge--off' : 'status-badge--on']">
                <span class="status-dot"></span>
                {{ selected.isActive === false ? 'Inactive' : 'Active' }}
              </span>
            </div>
            <div class="modal-grid">
              <div class="modal-field">
                <span class="field-label">Job Title</span>
                <span class="field-value">{{ selected.jobTitle || '-' }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Phone</span>
                <span class="field-value">{{ selected.phone || '-' }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Projects Owned</span>
                <span class="field-value">{{ selected._count?.projectsCreated ?? 0 }}</span>
              </div>
              <div class="modal-field">
                <span class="field-label">Tasks Created</span>
                <span class="field-value">{{ selected._count?.tasksCreated ?? 0 }}</span>
              </div>
              <div class="modal-field" style="grid-column: 1 / -1">
                <span class="field-label">Member Since</span>
                <span class="field-value">{{ formatDate(selected.createdAt) }}</span>
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
import { onMounted, reactive, ref } from 'vue'
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminPaginationMeta,
  type AdminUserRole,
} from '@/api/admin'
import type { User } from '@/types/user.types'

type AdminUser = User & {
  _count?: {
    projectsCreated?: number
    projectMembers?: number
    tasksCreated?: number
    taskAssignees?: number
  }
}

const users = ref<AdminUser[]>([])
const selected = ref<AdminUser | null>(null)
const search = ref('')
const page = ref(1)
const loading = ref(false)
const error = ref('')
const meta = reactive<AdminPaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })

function syncMeta(next: AdminPaginationMeta) {
  Object.assign(meta, next)
}

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await getAdminUsers({ search: search.value || undefined, page: page.value, limit: 20 })
    users.value = response.data as AdminUser[]
    syncMeta(response.meta)
  } catch {
    error.value = 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

async function changeRole(user: AdminUser, role: AdminUserRole) {
  if ((user.role || 'USER') === role) return
  if (!window.confirm(`Change ${user.email} role to ${role}?`)) {
    await loadUsers()
    return
  }
  try {
    const updated = await updateAdminUserRole(user.id, role)
    Object.assign(user, updated)
  } catch (err) {
    error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update role.'
    await loadUsers()
  }
}

async function toggleStatus(user: AdminUser) {
  const next = user.isActive === false
  const action = next ? 'unlock' : 'lock'
  if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return
  try {
    const updated = await updateAdminUserStatus(user.id, next)
    Object.assign(user, updated)
  } catch (err) {
    error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update status.'
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page { display: grid; gap: 16px; }

/* ─── Toolbar ────────────────────────────────────────── */
.page-toolbar { display: flex; gap: 10px; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 0; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; pointer-events: none; }
input[type="search"] { width: 100%; height: 42px; padding: 0 12px 0 38px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 14px; color: #1e293b; outline: none; box-sizing: border-box; transition: border-color 0.18s, box-shadow 0.18s; }
input[type="search"]:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
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
.skeleton-header { display: flex; gap: 60px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
.skeleton-row { display: flex; align-items: center; gap: 60px; padding: 16px 18px; border-bottom: 1px solid #f8fafc; }
.skeleton-user-cell { display: flex; align-items: center; gap: 10px; flex: 1; }
.skeleton-avatar-circle { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.skeleton-actions { display: flex; gap: 8px; }

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

/* ─── User cell ──────────────────────────────────────── */
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 14px; font-weight: 800; display: grid; place-items: center; flex-shrink: 0; }
.user-avatar--inactive { background: linear-gradient(135deg, #94a3b8, #64748b); }
.user-cell strong { display: block; font-weight: 700; color: #1e293b; }
.user-cell span { display: block; font-size: 12px; color: #64748b; margin-top: 1px; }

/* ─── Role select ────────────────────────────────────── */
.role-select { height: 30px; padding: 0 8px; border: 1px solid #e2e8f0; border-radius: 7px; background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569; outline: none; cursor: pointer; }
.role-select--admin { border-color: #c4b5fd; background: #f5f3ff; color: #7c3aed; }

/* ─── Status badge ───────────────────────────────────── */
.status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.status-badge--on { background: #dcfce7; color: #166534; }
.status-badge--off { background: #fee2e2; color: #991b1b; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ─── Stat cell ──────────────────────────────────────── */
.stat-cell { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.stat-owned { font-weight: 700; color: #334155; }
.stat-sep { color: #cbd5e1; }
.stat-member { color: #64748b; }

/* ─── Action buttons ─────────────────────────────────── */
.action-buttons { display: flex; gap: 6px; }
.btn-view { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.btn-view:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.btn-view svg { width: 12px; height: 12px; }
.btn-toggle { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid; }
.btn-toggle--lock { border-color: #fecaca; background: #fef2f2; color: #dc2626; }
.btn-toggle--lock:hover { background: #fee2e2; }
.btn-toggle--unlock { border-color: #bbf7d0; background: #f0fdf4; color: #16a34a; }
.btn-toggle--unlock:hover { background: #dcfce7; }
.btn-toggle svg { width: 12px; height: 12px; }

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
.modal { width: min(100%, 480px); background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 32px 80px rgba(15, 23, 42, 0.3); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px 24px 0; }
.modal-user-head { display: flex; align-items: center; gap: 14px; }
.modal-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 20px; font-weight: 800; display: grid; place-items: center; flex-shrink: 0; }
.modal-avatar--inactive { background: linear-gradient(135deg, #94a3b8, #64748b); }
.modal-user-head h2 { margin: 0 0 3px; font-size: 18px; font-weight: 800; color: #0f172a; }
.modal-user-head p { margin: 0; font-size: 13px; color: #64748b; }
.modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; transition: all 0.15s; }
.modal-close:hover { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
.modal-close svg { width: 14px; height: 14px; }
.modal-badges { display: flex; gap: 8px; padding: 14px 24px; }
.role-badge-pill { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
.role-badge-pill--admin { background: #ede9fe; color: #7c3aed; }
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
  .btn-primary { width: 100%; justify-content: center; }
  .pager { flex-direction: column; gap: 10px; }
  .modal-grid { grid-template-columns: 1fr; }
}
</style>
