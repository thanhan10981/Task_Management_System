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
          placeholder="Search member, project, or role…"
          @keyup.enter="page = 1; loadMembers()"
        />
      </div>
      <button type="button" class="btn-primary" @click="page = 1; loadMembers()">
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

    <!-- Table card -->
    <div class="data-card">
      <!-- Skeleton rows -->
      <template v-if="loading && members.length === 0">
        <div class="skeleton-header">
          <div class="skeleton" v-for="i in 5" :key="i" :style="`width: ${[80, 100, 90, 60, 70][i-1]}px; height: 12px`"></div>
        </div>
        <div v-for="i in 8" :key="i" class="skeleton-row">
          <div class="skeleton-avatar-wrap">
            <div class="skeleton skeleton-avatar-circle"></div>
            <div>
              <div class="skeleton" style="width:120px;height:13px;margin-bottom:6px"></div>
              <div class="skeleton" style="width:160px;height:11px"></div>
            </div>
          </div>
          <div class="skeleton" style="width:100px;height:13px"></div>
          <div class="skeleton" style="width:70px;height:13px"></div>
          <div class="skeleton" style="width:50px;height:22px;border-radius:6px"></div>
          <div class="skeleton" style="width:80px;height:13px"></div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="!loading && members.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
          </svg>
        </div>
        <h3>No members found</h3>
        <p>Try adjusting your search query.</p>
      </div>

      <!-- Data table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Project</th>
              <th>Project Owner</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ (member.user.fullName || member.user.email || 'U')[0].toUpperCase() }}</div>
                  <div>
                    <strong>{{ member.user.fullName }}</strong>
                    <span>{{ member.user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="project-cell">
                  <strong>{{ member.project.name }}</strong>
                  <span :class="['status-chip', `status-chip--${member.project.status?.toLowerCase()}`]">{{ member.project.status }}</span>
                </div>
              </td>
              <td class="td-muted">{{ member.project.creator?.email || '-' }}</td>
              <td>
                <span :class="['role-badge', member.role === 'OWNER' ? 'role-badge--owner' : '']">{{ member.role }}</span>
              </td>
              <td class="td-muted">{{ formatDate(member.joinedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading overlay for subsequent loads -->
      <div v-if="loading && members.length > 0" class="loading-overlay">
        <span class="spinner"></span>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pager">
      <span class="pager-info">
        Showing {{ members.length }} of {{ meta.total }} members
      </span>
      <div class="pager-controls">
        <button type="button" :disabled="page <= 1" @click="page--; loadMembers()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pager-page">{{ meta.page }} / {{ meta.totalPages || 1 }}</span>
        <button type="button" :disabled="page >= meta.totalPages" @click="page++; loadMembers()" class="pager-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
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
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(loadMembers)
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
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  height: 42px; padding: 0 18px;
  background: #6366f1; color: #fff; border: none; border-radius: 10px;
  font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap;
  transition: background 0.18s, transform 0.15s;
}
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
.btn-primary svg { width: 14px; height: 14px; }

/* ─── Error banner ───────────────────────────────────── */
.error-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 16px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 10px;
  color: #dc2626; font-size: 13px; font-weight: 600;
}
.error-banner svg { width: 16px; height: 16px; flex-shrink: 0; }
.err-slide-enter-active, .err-slide-leave-active { transition: all 0.2s ease; }
.err-slide-enter-from, .err-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── Data card ──────────────────────────────────────── */
.data-card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  position: relative;
  min-height: 200px;
}

/* ─── Skeleton ───────────────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.skeleton-header {
  display: flex; gap: 40px; padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}
.skeleton-row {
  display: flex; align-items: center; gap: 40px;
  padding: 16px 18px; border-bottom: 1px solid #f8fafc;
}
.skeleton-avatar-wrap { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.skeleton-avatar-circle { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }

/* ─── Empty ──────────────────────────────────────────── */
.empty-state { padding: 64px 20px; text-align: center; }
.empty-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: #f1f5f9; display: grid; place-items: center;
  margin: 0 auto 16px;
}
.empty-icon svg { width: 32px; height: 32px; color: #94a3b8; }
.empty-state h3 { margin: 0 0 6px; font-size: 16px; color: #334155; }
.empty-state p { margin: 0; color: #64748b; font-size: 14px; }

/* ─── Table ──────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 780px; }
th {
  text-align: left; padding: 12px 16px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: #94a3b8; border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #334155; vertical-align: middle; }
tbody tr { transition: background 0.15s; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #f8fafc; }
.td-muted { color: #94a3b8; font-size: 12px; }

/* ─── User cell ──────────────────────────────────────── */
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 13px; font-weight: 800;
  display: grid; place-items: center;
}
.user-cell strong { display: block; font-weight: 700; color: #1e293b; }
.user-cell span { display: block; font-size: 12px; color: #64748b; margin-top: 1px; }

/* ─── Project cell ───────────────────────────────────── */
.project-cell { display: flex; flex-direction: column; gap: 4px; }
.project-cell strong { font-weight: 700; color: #1e293b; }

/* ─── Chips ──────────────────────────────────────────── */
.status-chip { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; width: fit-content; }
.status-chip--active { background: #dcfce7; color: #166534; }
.status-chip--archived { background: #f1f5f9; color: #64748b; }
.status-chip--completed { background: #e0f2fe; color: #0369a1; }

.role-badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; background: #f1f5f9; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
.role-badge--owner { background: #ede9fe; color: #7c3aed; }

/* ─── Loading overlay ────────────────────────────────── */
.loading-overlay {
  position: absolute; inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: grid; place-items: center;
  backdrop-filter: blur(2px);
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Pager ──────────────────────────────────────────── */
.pager { display: flex; align-items: center; justify-content: space-between; }
.pager-info { font-size: 13px; color: #94a3b8; }
.pager-controls { display: flex; align-items: center; gap: 8px; }
.pager-page { font-size: 13px; font-weight: 700; color: #334155; padding: 0 4px; }
.pager-btn {
  width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid #e2e8f0; background: #fff; color: #475569;
  display: grid; place-items: center; cursor: pointer;
  transition: all 0.15s;
}
.pager-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pager-btn svg { width: 15px; height: 15px; }

@media (max-width: 640px) {
  .page-toolbar { flex-direction: column; }
  .btn-primary { width: 100%; justify-content: center; }
  .pager { flex-direction: column; gap: 10px; }
}
</style>
