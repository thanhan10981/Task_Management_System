<template>
  <section class="admin-page">
    <div class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Search by name, email, phone, job title" @keyup.enter="loadUsers">
      <button type="button" @click="loadUsers">Search</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="card table-wrap">
      <table>
        <thead>
          <tr><th>User</th><th>Role</th><th>Status</th><th>Projects</th><th>Tasks</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <strong>{{ user.fullName }}</strong>
              <span>{{ user.email }}</span>
            </td>
            <td>
              <select :value="user.role || 'USER'" @change="changeRole(user, ($event.target as HTMLSelectElement).value as 'USER' | 'ADMIN')">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>
            <td>
              <span :class="user.isActive === false ? 'badge badge-off' : 'badge badge-on'">
                {{ user.isActive === false ? 'Inactive' : 'Active' }}
              </span>
            </td>
            <td>{{ user._count?.projectsCreated ?? 0 }} owned / {{ user._count?.projectMembers ?? 0 }} member</td>
            <td>{{ user._count?.tasksCreated ?? 0 }} created</td>
            <td>
              <button type="button" @click="selected = user">View</button>
              <button type="button" class="danger" @click="toggleStatus(user)">
                {{ user.isActive === false ? 'Unlock' : 'Lock' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && users.length === 0" class="empty">No users found.</p>
      <p v-if="loading" class="empty">Loading users...</p>
    </div>

    <div class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; loadUsers()">Prev</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages || 1 }}</span>
      <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadUsers()">Next</button>
    </div>

    <div v-if="selected" class="modal-backdrop" @click="selected = null">
      <article class="modal" @click.stop>
        <h2>{{ selected.fullName }}</h2>
        <p>{{ selected.email }}</p>
        <dl>
          <dt>Role</dt><dd>{{ selected.role || 'USER' }}</dd>
          <dt>Status</dt><dd>{{ selected.isActive === false ? 'Inactive' : 'Active' }}</dd>
          <dt>Job title</dt><dd>{{ selected.jobTitle || '-' }}</dd>
          <dt>Phone</dt><dd>{{ selected.phone || '-' }}</dd>
          <dt>Created</dt><dd>{{ formatDate(selected.createdAt) }}</dd>
        </dl>
        <button type="button" @click="selected = null">Close</button>
      </article>
    </div>
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
  return new Date(value).toLocaleString()
}

onMounted(loadUsers)
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
table { width: 100%; min-width: 900px; border-collapse: collapse; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; vertical-align: middle; }
th { color: #64748b; font-size: 12px; text-transform: uppercase; }
td strong, td span { display: block; }
td span { color: #64748b; margin-top: 2px; }
.badge { display: inline-flex; border-radius: 999px; padding: 4px 8px; font-size: 12px; font-weight: 900; }
.badge-on { background: #dcfce7; color: #166534; }
.badge-off { background: #fee2e2; color: #991b1b; }
.empty, .error { padding: 14px; color: #64748b; }
.error { color: #dc2626; font-weight: 800; }
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 10px; color: #64748b; }
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(15,23,42,.45); z-index: 100; }
.modal { width: min(100%, 460px); background: #fff; border-radius: 10px; padding: 20px; }
.modal h2 { margin: 0 0 4px; }
dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px; }
dt { color: #64748b; font-weight: 800; }
@media (max-width: 640px) { .toolbar { flex-direction: column; } .pager { justify-content: space-between; } }
</style>
