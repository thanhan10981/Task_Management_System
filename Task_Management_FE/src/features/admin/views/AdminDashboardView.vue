<template>
  <div class="admin-page">
    <div v-if="loading" class="admin-card">Loading dashboard...</div>
    <div v-else-if="error" class="admin-error">{{ error }}</div>
    <template v-else-if="stats">
      <section class="stats-grid">
        <article v-for="card in statCards" :key="card.label" class="admin-card stat-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="admin-grid">
        <article class="admin-card">
          <h2>Tasks by Status</h2>
          <div v-if="stats.tasksByStatus.length === 0" class="muted">No task data yet.</div>
          <div v-for="status in stats.tasksByStatus" :key="status.statusId" class="status-row">
            <span>{{ status.statusName }}</span>
            <strong>{{ status.count }}</strong>
          </div>
        </article>

        <article class="admin-card">
          <h2>Recent Projects</h2>
          <div v-for="project in stats.recentProjects" :key="project.id" class="list-row">
            <div>
              <strong>{{ project.name }}</strong>
              <span>{{ project.creator?.email || 'Unknown owner' }}</span>
            </div>
            <small>{{ project.status }}</small>
          </div>
        </article>
      </section>

      <article class="admin-card">
        <h2>Recent Tasks</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Created</th></tr>
            </thead>
            <tbody>
              <tr v-for="task in stats.recentTasks" :key="task.id">
                <td>{{ task.title }}</td>
                <td>{{ task.project?.name || '-' }}</td>
                <td>{{ task.status?.name || '-' }}</td>
                <td>{{ task.priority }}</td>
                <td>{{ formatDate(task.createdAt) }}</td>
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

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Users', value: stats.value.totals.users },
    { label: 'Active Users', value: stats.value.totals.activeUsers },
    { label: 'Projects', value: stats.value.totals.projects },
    { label: 'Tasks', value: stats.value.totals.tasks },
  ]
})

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

onMounted(async () => {
  try {
    stats.value = await getAdminStats()
  } catch {
    error.value = 'Failed to load admin dashboard.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-page { display: grid; gap: 18px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.admin-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; box-shadow: 0 8px 28px rgba(15,23,42,0.05); }
.stat-card span { color: #64748b; font-weight: 800; font-size: 12px; text-transform: uppercase; }
.stat-card strong { display: block; margin-top: 8px; font-size: 30px; }
h2 { margin: 0 0 12px; font-size: 16px; }
.status-row, .list-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #f1f5f9; }
.list-row div { min-width: 0; display: grid; gap: 3px; }
.list-row span, .muted { color: #64748b; font-size: 13px; }
.list-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 680px; }
th, td { text-align: left; padding: 11px 10px; border-top: 1px solid #eef2f7; font-size: 13px; }
th { color: #64748b; font-size: 12px; text-transform: uppercase; }
.admin-error { color: #dc2626; font-weight: 800; }
@media (max-width: 900px) { .stats-grid, .admin-grid { grid-template-columns: 1fr; } }
</style>
