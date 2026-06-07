<template>
  <div class="admin-page">
    <!-- Skeleton loading -->
    <template v-if="loading">
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
          <div class="skeleton skeleton-label"></div>
          <div class="skeleton skeleton-value"></div>
          <div class="skeleton skeleton-sub"></div>
        </div>
      </div>
      <div class="admin-grid">
        <div class="admin-card skeleton-card" style="height:220px">
          <div class="skeleton" style="width:120px;height:16px;margin-bottom:18px"></div>
          <div v-for="i in 4" :key="i" class="skeleton" style="height:14px;margin-bottom:12px;border-radius:6px"></div>
        </div>
        <div class="admin-card skeleton-card" style="height:220px">
          <div class="skeleton" style="width:140px;height:16px;margin-bottom:18px"></div>
          <div v-for="i in 3" :key="i" class="skeleton" style="height:40px;margin-bottom:10px;border-radius:8px"></div>
        </div>
      </div>
      <div class="admin-card skeleton-card" style="height:260px">
        <div class="skeleton" style="width:120px;height:16px;margin-bottom:18px"></div>
        <div v-for="i in 5" :key="i" class="skeleton" style="height:14px;margin-bottom:14px;border-radius:6px"></div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Failed to load dashboard</h3>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="reload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Try again
      </button>
    </div>

    <!-- Data loaded -->
    <template v-else-if="stats">
      <!-- Stat cards -->
      <section class="stats-grid">
        <article
          v-for="card in statCards"
          :key="card.label"
          class="stat-card"
          :style="`--accent: ${card.color}`"
        >
          <div class="stat-icon" :style="`background: ${card.color}1a`">
            <span v-html="card.icon" />
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ card.label }}</span>
            <strong class="stat-value">{{ card.value.toLocaleString() }}</strong>
            <span v-if="card.sub" class="stat-sub">{{ card.sub }}</span>
          </div>
        </article>
      </section>

      <!-- Middle grid -->
      <section class="admin-grid">
        <!-- Tasks by Status -->
        <article class="admin-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Tasks by Status
            </h2>
            <span class="card-badge">{{ stats.tasksByStatus.length }} statuses</span>
          </div>
          <div v-if="stats.tasksByStatus.length === 0" class="empty-inline">
            <span>No task data yet.</span>
          </div>
          <div v-for="status in stats.tasksByStatus" :key="status.statusId" class="status-row">
            <div class="status-dot-wrap">
              <span class="status-dot" />
              <span>{{ status.statusName }}</span>
            </div>
            <strong class="status-count">{{ status.count }}</strong>
          </div>
        </article>

        <!-- Recent Projects -->
        <article class="admin-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              Recent Projects
            </h2>
            <span class="card-badge">{{ stats.recentProjects.length }} projects</span>
          </div>
          <div v-for="project in stats.recentProjects" :key="project.id" class="list-row">
            <div class="project-avatar">{{ project.name[0].toUpperCase() }}</div>
            <div class="list-info">
              <strong>{{ project.name }}</strong>
              <span>{{ project.creator?.email || 'Unknown owner' }}</span>
            </div>
            <span :class="['status-pill', `status-pill--${project.status?.toLowerCase()}`]">
              {{ project.status }}
            </span>
          </div>
        </article>
      </section>

      <!-- Recent Tasks table -->
      <article class="admin-card">
        <div class="card-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M3 17h18M3 12h18"/></svg>
            Recent Tasks
          </h2>
          <span class="card-badge">{{ stats.recentTasks.length }} tasks</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in stats.recentTasks" :key="task.id">
                <td class="td-main">{{ task.title }}</td>
                <td>{{ task.project?.name || '-' }}</td>
                <td>
                  <span class="status-chip">{{ task.status?.name || '-' }}</span>
                </td>
                <td>
                  <span :class="['priority-chip', `priority-chip--${task.priority?.toLowerCase()}`]">{{ task.priority }}</span>
                </td>
                <td class="td-muted">{{ formatDate(task.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAdminStats, type AdminStats } from '@/api/admin'

const stats = ref<AdminStats | null>(null)
const loading = ref(true)
const error = ref('')

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b']
const ICONS = [
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
]

const statCards = computed(() => {
  if (!stats.value) return []
  const { totals } = stats.value
  return [
    { label: 'Total Users', value: totals.users, sub: `${totals.activeUsers} active`, color: COLORS[0], icon: ICONS[0] },
    { label: 'Active Users', value: totals.activeUsers, sub: 'Currently active', color: COLORS[1], icon: ICONS[1] },
    { label: 'Projects', value: totals.projects, sub: 'All projects', color: COLORS[2], icon: ICONS[2] },
    { label: 'Tasks', value: totals.tasks, sub: 'Total tasks', color: COLORS[3], icon: ICONS[3] },
  ]
})

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await getAdminStats()
  } catch {
    error.value = 'Failed to load admin dashboard.'
  } finally {
    loading.value = false
  }
}

function reload() { load() }
onMounted(load)
</script>

<style scoped>
.admin-page { display: grid; gap: 20px; }

/* ─── Skeleton ───────────────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.skeleton-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.skeleton-label { width: 80px; height: 12px; margin-bottom: 12px; }
.skeleton-value { width: 60px; height: 32px; margin-bottom: 8px; }
.skeleton-sub { width: 100px; height: 11px; }

/* ─── Stat cards ─────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.stat-card:hover { box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1); transform: translateY(-2px); }
.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.stat-icon :deep(svg) { width: 20px; height: 20px; color: var(--accent); }
.stat-body { min-width: 0; }
.stat-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
.stat-value { display: block; font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
.stat-sub { display: block; font-size: 12px; color: #64748b; margin-top: 4px; }

/* ─── Grid ───────────────────────────────────────────── */
.admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* ─── Admin card ─────────────────────────────────────── */
.admin-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

/* ─── Card header ────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.card-header h2 :deep(svg) { width: 16px; height: 16px; color: #6366f1; }
.card-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 8px;
  border-radius: 20px;
}

/* ─── Status rows ────────────────────────────────────── */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
}
.status-dot-wrap { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; }
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  box-shadow: 0 0 0 3px #eef2ff;
}
.status-count { font-size: 15px; font-weight: 800; color: #1e293b; }

/* ─── List rows ──────────────────────────────────────── */
.list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
}
.project-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.list-info { flex: 1; min-width: 0; }
.list-info strong { display: block; font-size: 13px; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-info span { display: block; font-size: 12px; color: #64748b; margin-top: 1px; }

/* ─── Status pill ────────────────────────────────────── */
.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-pill--active { background: #dcfce7; color: #166534; }
.status-pill--archived { background: #f1f5f9; color: #64748b; }
.status-pill--completed { background: #e0f2fe; color: #0369a1; }

/* ─── Table ──────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
}
td { padding: 13px 12px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #334155; }
tbody tr { transition: background 0.15s ease; }
tbody tr:hover { background: #f8fafc; }
.td-main { font-weight: 600; color: #1e293b; }
.td-muted { color: #94a3b8; font-size: 12px; }

/* ─── Chips ──────────────────────────────────────────── */
.status-chip {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.priority-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.priority-chip--low { background: #f0fdf4; color: #16a34a; }
.priority-chip--medium { background: #fffbeb; color: #b45309; }
.priority-chip--high { background: #fff7ed; color: #c2410c; }
.priority-chip--urgent { background: #fef2f2; color: #dc2626; }

/* ─── Error state ────────────────────────────────────── */
.error-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 14px;
}
.error-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fee2e2;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
}
.error-icon svg { width: 28px; height: 28px; color: #dc2626; }
.error-state h3 { margin: 0 0 6px; font-size: 18px; color: #1e293b; }
.error-state p { margin: 0 0 20px; color: #64748b; font-size: 14px; }
.empty-inline { padding: 20px 0; color: #94a3b8; font-size: 13px; text-align: center; }
.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.btn-retry:hover { background: #4f46e5; }
.btn-retry svg { width: 14px; height: 14px; }

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .admin-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
