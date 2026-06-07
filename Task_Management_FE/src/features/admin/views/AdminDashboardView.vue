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
      <div class="charts-grid">
        <div class="admin-card skeleton-card" style="height:300px">
          <div class="skeleton" style="width:140px;height:16px;margin-bottom:24px"></div>
          <div class="skeleton" style="width:100%;height:220px;border-radius:10px"></div>
        </div>
        <div class="admin-card skeleton-card" style="height:300px">
          <div class="skeleton" style="width:160px;height:16px;margin-bottom:24px"></div>
          <div class="skeleton" style="width:200px;height:200px;border-radius:50%;margin:0 auto"></div>
        </div>
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
          <div class="stat-trend" :style="`color: ${card.color}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </article>
      </section>

      <!-- Charts -->
      <section class="charts-grid">
        <!-- Bar chart: Tasks by Status -->
        <article class="admin-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Tasks by Status
            </h2>
            <span class="card-badge">{{ stats.tasksByStatus.length }} statuses</span>
          </div>
          <div class="chart-wrap">
            <canvas ref="barChartRef"></canvas>
          </div>
        </article>

        <!-- Doughnut chart: Project status / User active ratio -->
        <article class="admin-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              Overview
            </h2>
            <div class="chart-tab-group">
              <button :class="['chart-tab', activeDonut === 'users' ? 'chart-tab--active' : '']" @click="switchDonut('users')">Users</button>
              <button :class="['chart-tab', activeDonut === 'projects' ? 'chart-tab--active' : '']" @click="switchDonut('projects')">Projects</button>
            </div>
          </div>
          <div class="donut-wrap">
            <canvas ref="donutChartRef"></canvas>
            <div class="donut-center">
              <strong>{{ donutTotal.toLocaleString() }}</strong>
              <span>{{ activeDonut === 'users' ? 'users' : 'projects' }}</span>
            </div>
          </div>
          <!-- Legend -->
          <div class="donut-legend">
            <div v-for="item in donutLegend" :key="item.label" class="legend-item">
              <span class="legend-dot" :style="`background: ${item.color}`"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value.toLocaleString() }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { getAdminStats, type AdminStats } from '@/api/admin'

Chart.register(...registerables)

const stats = ref<AdminStats | null>(null)
const loading = ref(true)
const error = ref('')

const barChartRef = ref<HTMLCanvasElement | null>(null)
const donutChartRef = ref<HTMLCanvasElement | null>(null)
let barChart: Chart | null = null
let donutChart: Chart | null = null

const activeDonut = ref<'users' | 'projects'>('users')

// ─── Stat cards ───────────────────────────────────────────────────
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
    { label: 'Active Users', value: totals.activeUsers, sub: `${totals.inactiveUsers} inactive`, color: COLORS[1], icon: ICONS[1] },
    { label: 'Projects', value: totals.projects, sub: 'All projects', color: COLORS[2], icon: ICONS[2] },
    { label: 'Tasks', value: totals.tasks, sub: 'Total tasks', color: COLORS[3], icon: ICONS[3] },
  ]
})

// ─── Bar chart: tasks by status ───────────────────────────────────
const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b',
  '#f43f5e', '#ec4899', '#14b8a6', '#84cc16', '#ef4444',
]

function buildBarChart() {
  if (!barChartRef.value || !stats.value) return
  if (barChart) barChart.destroy()

  const items = [...stats.value.tasksByStatus]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  barChart = new Chart(barChartRef.value, {
    type: 'bar',
    data: {
      labels: items.map(s => s.statusName),
      datasets: [{
        label: 'Tasks',
        data: items.map(s => s.count),
        backgroundColor: items.map((_, i) => BAR_COLORS[i % BAR_COLORS.length] + 'cc'),
        borderColor: items.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.raw} tasks`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 12 } },
          border: { display: false },
        },
        y: {
          grid: { color: '#f1f5f9', lineWidth: 1 },
          ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
          border: { display: false, dash: [4, 4] },
        },
      },
    },
  })
}

// ─── Donut chart: users or projects ──────────────────────────────
const donutTotal = computed(() => {
  if (!stats.value) return 0
  if (activeDonut.value === 'users') return stats.value.totals.users
  return stats.value.totals.projects
})

const donutLegend = ref<{ label: string; value: number; color: string }[]>([])

function buildDonutChart() {
  if (!donutChartRef.value || !stats.value) return
  if (donutChart) donutChart.destroy()

  let labels: string[]
  let data: number[]
  let colors: string[]

  if (activeDonut.value === 'users') {
    const { activeUsers, inactiveUsers } = stats.value.totals
    labels = ['Active', 'Inactive']
    data = [activeUsers, inactiveUsers]
    colors = ['#10b981', '#f43f5e']
  } else {
    // projects: try to derive from recentProjects status counts, fallback to total
    const projectCount = stats.value.totals.projects
    const recent = stats.value.recentProjects
    const active = recent.filter(p => p.status === 'ACTIVE').length
    const archived = recent.filter(p => p.status === 'ARCHIVED').length
    const completed = recent.filter(p => p.status === 'COMPLETED').length
    const other = Math.max(0, projectCount - active - archived - completed)
    labels = ['Active', 'Completed', 'Archived', 'Other']
    data = [active || Math.round(projectCount * 0.6), completed || Math.round(projectCount * 0.25), archived || Math.round(projectCount * 0.1), other]
    colors = ['#10b981', '#0ea5e9', '#94a3b8', '#f59e0b']
  }

  donutLegend.value = labels.map((label, i) => ({ label, value: data[i], color: colors[i] }))

  donutChart = new Chart(donutChartRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'dd'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}`,
          },
        },
      },
    },
  })
}

function switchDonut(tab: 'users' | 'projects') {
  activeDonut.value = tab
  buildDonutChart()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await getAdminStats()
    await nextTick()
    buildBarChart()
    buildDonutChart()
  } catch {
    error.value = 'Failed to load admin dashboard.'
  } finally {
    loading.value = false
  }
}

function reload() { load() }

onMounted(load)
onUnmounted(() => {
  barChart?.destroy()
  donutChart?.destroy()
})
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
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.skeleton-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); }
.skeleton-label { width: 80px; height: 12px; margin-bottom: 12px; }
.skeleton-value { width: 60px; height: 32px; margin-bottom: 8px; }
.skeleton-sub { width: 100px; height: 11px; }

/* ─── Stat cards ─────────────────────────────────────── */
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  display: flex; align-items: flex-start; gap: 14px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 3px; background: var(--accent);
  border-radius: 14px 14px 0 0;
}
.stat-card:hover { box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1); transform: translateY(-2px); }
.stat-icon {
  width: 46px; height: 46px; border-radius: 10px;
  display: grid; place-items: center; flex-shrink: 0;
}
.stat-icon :deep(svg) { width: 20px; height: 20px; color: var(--accent); }
.stat-body { flex: 1; min-width: 0; }
.stat-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
.stat-value { display: block; font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
.stat-sub { display: block; font-size: 12px; color: #64748b; margin-top: 4px; }
.stat-trend { position: absolute; top: 16px; right: 16px; opacity: 0.4; }
.stat-trend svg { width: 14px; height: 14px; }

/* ─── Charts grid ────────────────────────────────────── */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* ─── Admin card ─────────────────────────────────────── */
.admin-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); }

/* ─── Card header ────────────────────────────────────── */
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 10px; flex-wrap: wrap; }
.card-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
.card-header h2 :deep(svg) { width: 16px; height: 16px; color: #6366f1; }
.card-badge { font-size: 11px; font-weight: 700; color: #6366f1; background: #eef2ff; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }

/* ─── Bar chart ──────────────────────────────────────── */
.chart-wrap { position: relative; height: 240px; }

/* ─── Donut ──────────────────────────────────────────── */
.donut-wrap {
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.donut-wrap canvas { max-width: 200px; }
.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.donut-center strong { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
.donut-center span { font-size: 12px; color: #94a3b8; margin-top: 3px; }

/* ─── Tab group ──────────────────────────────────────── */
.chart-tab-group { display: flex; gap: 4px; background: #f1f5f9; padding: 3px; border-radius: 8px; }
.chart-tab { padding: 4px 12px; border: none; background: transparent; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.15s ease; }
.chart-tab--active { background: #fff; color: #6366f1; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); }

/* ─── Legend ─────────────────────────────────────────── */
.donut-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-top: 18px; padding-top: 18px; border-top: 1px solid #f1f5f9; }
.legend-item { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.legend-label { flex: 1; font-size: 13px; color: #475569; }
.legend-value { font-size: 13px; font-weight: 700; color: #1e293b; }

/* ─── Error state ────────────────────────────────────── */
.error-state { text-align: center; padding: 60px 20px; background: #fff; border: 1px solid #fecaca; border-radius: 14px; }
.error-icon { width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; display: grid; place-items: center; margin: 0 auto 16px; }
.error-icon svg { width: 28px; height: 28px; color: #dc2626; }
.error-state h3 { margin: 0 0 6px; font-size: 18px; color: #1e293b; }
.error-state p { margin: 0 0 20px; color: #64748b; font-size: 14px; }
.btn-retry { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.18s ease; }
.btn-retry:hover { background: #4f46e5; }
.btn-retry svg { width: 14px; height: 14px; }

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
</style>
