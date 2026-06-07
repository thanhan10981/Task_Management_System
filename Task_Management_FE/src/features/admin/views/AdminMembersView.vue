<template>
  <section class="admin-page">
    <div class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Search member, project, or role" @keyup.enter="page = 1; loadMembers()">
      <button type="button" @click="page = 1; loadMembers()">Search</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Member</th><th>Project</th><th>Project Owner</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td><strong>{{ member.user.fullName }}</strong><span>{{ member.user.email }}</span></td>
            <td><strong>{{ member.project.name }}</strong><span>{{ member.project.status }}</span></td>
            <td>{{ member.project.creator?.email || '-' }}</td>
            <td>{{ member.role }}</td>
            <td>{{ formatDate(member.joinedAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading || members.length === 0" class="empty">{{ loading ? 'Loading members...' : 'No members found.' }}</p>
    </div>

    <div class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; loadMembers()">Prev</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages || 1 }}</span>
      <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadMembers()">Next</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getAdminMembers, type AdminMember, type AdminPaginationMeta } from '@/api/admin'

const members = ref<AdminMember[]>([])
const search = ref('')
const page = ref(1)
const loading = ref(false)
const error = ref('')
const meta = reactive<AdminPaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 })

async function loadMembers() {
  loading.value = true
  error.value = ''
  try {
    const response = await getAdminMembers({ search: search.value || undefined, page: page.value, limit: 20 })
    members.value = response.data
    Object.assign(meta, response.meta)
  } catch {
    error.value = 'Failed to load members.'
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

onMounted(loadMembers)
</script>

<style scoped>
.admin-page { display: grid; gap: 14px; }
.toolbar { display: flex; gap: 10px; }
input { flex: 1; min-width: 0; height: 38px; border: 1px solid #dbe3ef; border-radius: 8px; padding: 0 10px; background: #fff; }
button { border: 1px solid #dbe3ef; border-radius: 8px; background: #fff; padding: 8px 10px; font-weight: 800; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 820px; border-collapse: collapse; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; }
th { color: #64748b; font-size: 12px; text-transform: uppercase; }
td strong, td span { display: block; }
td span { color: #64748b; margin-top: 2px; }
.empty, .error { padding: 14px; color: #64748b; }
.error { color: #dc2626; font-weight: 800; }
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 10px; color: #64748b; }
@media (max-width: 640px) { .toolbar { flex-direction: column; } .pager { justify-content: space-between; } }
</style>
