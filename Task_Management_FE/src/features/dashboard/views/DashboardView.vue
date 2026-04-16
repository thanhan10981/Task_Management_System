<template>
  <div class="db-root">
    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div class="db-header">
      <div>
        <h2 class="db-title">Dashboard</h2>
        <p class="db-subtitle">Manage your workspace and project context from one place.</p>
      </div>
    </div>

    <!-- ── No Project Selected ────────────────────────────────────── -->
    <div v-if="showProjectResolvingState" class="db-empty card">
      <div class="db-spinner"></div>
      <h3 class="db-empty-title">Restoring your last workspace...</h3>
      <p class="db-empty-desc">We are checking your most recent project and access permissions.</p>
    </div>

    <div v-else-if="!currentProjectId && !hasProjects" class="db-empty card">
      <div class="db-empty-icon">🚀</div>
      <h3 class="db-empty-title">No Project Yet</h3>
      <p class="db-empty-desc">
        You have not joined any project yet. Create your first project to start tracking tasks.
      </p>
      <button class="db-empty-btn" @click="goToCreateProject">Create Project</button>
    </div>

    <div v-else-if="!currentProjectId" class="db-empty card">
      <div class="db-empty-icon">📋</div>
      <h3 class="db-empty-title">No Project Selected</h3>
      <p class="db-empty-desc">Please select a project from the header dropdown to view dashboard analytics.</p>
    </div>

    <!-- ── Main Dashboard Content ─────────────────────────────────── -->
    <template v-else>
      <!-- Stat Cards -->
      <div class="db-stat-grid">
        <!-- Task Completed -->
        <div class="db-stat-card">
          <div class="db-stat-top">
            <div class="db-stat-label-row">
              <span class="db-stat-icon text-indigo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <span class="db-stat-label">Task Completed</span>
            </div>
            <span class="db-stat-value">{{ stats.completed }}</span>
          </div>
          <div class="db-stat-chart">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="db-sparkline indigo">
              <defs>
                <linearGradient id="ig1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
                  <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,30 C15,28 20,20 35,22 C50,24 55,16 70,18 C85,20 95,14 120,10 L120,40 L0,40Z" fill="url(#ig1)"/>
              <path d="M0,30 C15,28 20,20 35,22 C50,24 55,16 70,18 C85,20 95,14 120,10" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="db-stat-footer">
            <span class="db-stat-more indigo-text">{{ statFooters.completedPrimary }}</span>
            <span class="db-stat-period">{{ statFooters.completedSecondary }}</span>
          </div>
        </div>

        <!-- New Task -->
        <div class="db-stat-card">
          <div class="db-stat-top">
            <div class="db-stat-label-row">
              <span class="db-stat-icon text-cyan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
              </span>
              <span class="db-stat-label">New Task</span>
            </div>
            <span class="db-stat-value">{{ stats.newTask }}</span>
          </div>
          <div class="db-stat-chart">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="db-sparkline cyan">
              <defs>
                <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.15"/>
                  <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,28 C10,26 20,22 35,24 C50,26 60,18 75,16 C90,14 100,20 120,12 L120,40 L0,40Z" fill="url(#ig2)"/>
              <path d="M0,28 C10,26 20,22 35,24 C50,26 60,18 75,16 C90,14 100,20 120,12" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="db-stat-footer">
            <span class="db-stat-more cyan-text">{{ statFooters.newTaskPrimary }}</span>
            <span class="db-stat-period">{{ statFooters.newTaskSecondary }}</span>
          </div>
        </div>

        <!-- Project Done -->
        <div class="db-stat-card">
          <div class="db-stat-top">
            <div class="db-stat-label-row">
              <span class="db-stat-icon text-rose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </span>
              <span class="db-stat-label">Project Done</span>
            </div>
            <span class="db-stat-value">{{ stats.projectDone }}</span>
          </div>
          <div class="db-stat-chart">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="db-sparkline rose">
              <defs>
                <linearGradient id="ig3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.12"/>
                  <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,22 C15,20 25,26 40,18 C55,10 65,24 80,20 C95,16 105,22 120,14 L120,40 L0,40Z" fill="url(#ig3)"/>
              <path d="M0,22 C15,20 25,26 40,18 C55,10 65,24 80,20 C95,16 105,22 120,14" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="db-stat-footer">
            <span class="db-stat-more rose-text">{{ statFooters.projectDonePrimary }}</span>
            <span class="db-stat-period">{{ statFooters.projectDoneSecondary }}</span>
          </div>
        </div>
      </div>

      <!-- ── Area Chart ────────────────────────────────────────────── -->
      <div class="db-chart-card card">
        <div class="db-chart-header">
          <h3 class="db-chart-title">Task Done</h3>
          <div class="db-chart-tabs">
            <button
              v-for="tab in chartTabs"
              :key="tab.value"
              class="db-chart-tab"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>

        <div class="db-chart-wrap">
          <canvas
            v-if="hasChartData"
            ref="chartCanvas"
            class="db-area-chart"
          ></canvas>

          <div v-else class="db-chart-empty">
            No analytics data available for this period.
          </div>
        </div>
      </div>

      <!-- ── Task List ──────────────────────────────────────────────── -->
      <div class="db-task-section">
        <h3 class="db-section-title">Task</h3>

        <div v-if="tasksLoading" class="db-task-loading">
          <div class="db-spinner"></div>
          <span>Loading tasks…</span>
        </div>

        <div v-else-if="tasksError" class="db-task-error">Failed to load tasks. Please try again.</div>

        <div v-else-if="taskList.length === 0" class="db-task-empty">
          No tasks assigned for this project yet.
        </div>

        <div v-else class="db-task-list">
          <div
            v-for="task in taskList"
            :key="task.id"
            class="db-task-row"
          >
            <!-- Play icon -->
            <div class="db-task-play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>

            <!-- Time info -->
            <div class="db-task-time">
              <span class="db-task-time-label">Start from</span>
              <span class="db-task-time-val">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                {{ formatTime(task.createdAt) }}
              </span>
            </div>

            <!-- Task details -->
            <div class="db-task-details">
              <p class="db-task-title">{{ task.title }}</p>
              <div class="db-task-meta">
                <span class="db-task-link">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  task-link.example.com
                </span>
                <span class="db-task-comments">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  comments unavailable
                </span>
              </div>
            </div>

            <!-- Progress -->
            <div class="db-task-progress-col">
              <span class="db-task-progress-label">{{ getProgress(task.status) }}% complete</span>
              <div class="db-task-progress-bar">
                <div
                  class="db-task-progress-fill"
                  :style="{ width: getProgress(task.status) + '%' }"
                  :class="getProgressClass(task.status)"
                ></div>
              </div>
            </div>

            <!-- Reminder button -->
            <button class="db-task-reminder">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              Reminder
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project.store'
import { useTasksQuery } from '@/features/tasks/composables/useTasksQuery'
import { useRouter } from 'vue-router'
import {
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  type ChartDataset,
} from 'chart.js'
import { useTaskAnalyticsChartQuery } from '@/features/dashboard/composables/useTaskAnalyticsChartQuery'
import type { TaskChartPeriod } from '@/features/dashboard/schemas/task-chart.schema'

Chart.register(
  LineController,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Tooltip,
  Filler
)

const router = useRouter()

// ─── Store ────────────────────────────────────────────────────────────────────
const projectStore = useProjectStore()
const { currentProjectId, hasProjects, loadingProjects, initialized, projectContextResolved } =
  storeToRefs(projectStore)

const showProjectResolvingState = computed(
  () => !initialized.value || (loadingProjects.value && !projectContextResolved.value)
)

// ─── Tasks query ──────────────────────────────────────────────────────────────
const taskQueryParams = computed(() =>
  currentProjectId.value ? { projectId: currentProjectId.value } : {}
)

const {
  data: tasksData,
  isLoading: tasksLoading,
  isError: tasksError,
} = useTasksQuery(taskQueryParams, {
  enabled: computed(() => Boolean(currentProjectId.value)),
})

const taskList = computed(() => tasksData.value?.data ?? [])
const chartSummary = computed(() => taskChartResponse.value?.data?.summary)
const activeTabLabel = computed(
  () => chartTabs.find((tab) => tab.value === activeTab.value)?.label ?? 'Selected'
)

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const tasks = taskList.value
  return {
    completed: tasks.filter((t) => t.status === 'done').length,
    newTask: tasks.filter((t) => t.status === 'todo').length,
    projectDone: Math.round(chartSummary.value?.completionRate ?? 0),
  }
})

const statFooters = computed(() => {
  const totalTasks = chartSummary.value?.totalTasks ?? taskList.value.length

  return {
    completedPrimary: `${stats.value.completed} done`,
    completedSecondary: `of ${totalTasks} total tasks`,
    newTaskPrimary: `${stats.value.newTask} pending`,
    newTaskSecondary: 'live from tasks API',
    projectDonePrimary: `${stats.value.projectDone}% rate`,
    projectDoneSecondary: `${activeTabLabel.value} period`,
  }
})

// ─── Chart ────────────────────────────────────────────────────────────────────
const chartTabs = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const
const activeTab = ref<TaskChartPeriod>('monthly')

const { data: taskChartResponse } = useTaskAnalyticsChartQuery(
  activeTab,
  computed(() => Boolean(currentProjectId.value))
)

const chartDataFromApi = computed(() => taskChartResponse.value?.data)

const currentData = computed(() => {
  const apiData = chartDataFromApi.value

  if (!apiData) {
    return {
      labels: [],
      series1: [],
      series2: [],
    }
  }

  const labels = apiData.labels
  const totalSeries = apiData.totalSeries
  const completedSeries = apiData.completedSeries

  const hasValidLength =
    labels.length > 1 &&
    labels.length === totalSeries.length &&
    labels.length === completedSeries.length

  if (!hasValidLength) {
    return {
      labels: [],
      series1: [],
      series2: [],
    }
  }

  return {
    labels,
    series1: completedSeries,
    series2: totalSeries,
  }
})

const hasChartData = computed(() => currentData.value.labels.length > 1)

const currentLabels = computed(() => currentData.value.labels)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let taskDoneChart: Chart<'line'> | null = null

const MAX_VAL = computed(() => {
  const values = [...currentData.value.series1, ...currentData.value.series2]
  const max = Math.max(...values, 0)

  if (max <= 10) {
    return 10
  }

  const magnitude = 10 ** Math.floor(Math.log10(max))
  const normalized = max / magnitude
  const scale = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

  return scale * magnitude
})

function getCssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function destroyTaskDoneChart() {
  if (taskDoneChart) {
    taskDoneChart.destroy()
    taskDoneChart = null
  }
}

function buildChartDatasets(): ChartDataset<'line', number[]>[] {
  const surfaceColor = getCssColor('--bg-surface', '#ffffff')

  return [
    {
      label: 'Completed tasks',
      data: currentData.value.series1,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0)',
      pointBackgroundColor: surfaceColor,
      pointBorderColor: '#6366f1',
      pointHoverBackgroundColor: surfaceColor,
      pointHoverBorderColor: '#6366f1',
      pointBorderWidth: 2,
      pointHoverBorderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 7,
      borderWidth: 3,
      tension: 0.42,
      fill: false,
      cubicInterpolationMode: 'monotone',
    },
    {
      label: 'Total tasks',
      data: currentData.value.series2,
      borderColor: '#13abc9',
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart

        if (!chartArea) {
          return 'rgba(19, 171, 201, 0.18)'
        }

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(19, 171, 201, 0.24)')
        gradient.addColorStop(0.65, 'rgba(19, 171, 201, 0.08)')
        gradient.addColorStop(1, 'rgba(19, 171, 201, 0.02)')
        return gradient
      },
      pointBackgroundColor: surfaceColor,
      pointBorderColor: '#13abc9',
      pointHoverBackgroundColor: surfaceColor,
      pointHoverBorderColor: '#13abc9',
      pointBorderWidth: 2,
      pointHoverBorderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 7,
      borderWidth: 4,
      tension: 0.42,
      fill: true,
      cubicInterpolationMode: 'monotone',
    },
  ]
}

async function renderTaskDoneChart() {
  if (!hasChartData.value) {
    destroyTaskDoneChart()
    return
  }

  await nextTick()

  if (!chartCanvas.value) {
    return
  }

  const axisTextColor = getCssColor('--text-secondary', '#64748b')
  const gridColor = getCssColor('--border-soft', '#e7eef8')

  destroyTaskDoneChart()

  taskDoneChart = new Chart<'line', number[], string>(chartCanvas.value, {
    type: 'line',
    data: {
      labels: currentLabels.value,
      datasets: buildChartDatasets(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 420,
        easing: 'easeOutCubic',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          displayColors: false,
          padding: 10,
          cornerRadius: 10,
        },
      },
      layout: {
        padding: {
          top: 12,
          right: 12,
          bottom: 0,
          left: 8,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: axisTextColor,
            padding: 16,
            font: {
              size: 12,
              weight: 500,
            },
          },
        },
        y: {
          min: 0,
          max: MAX_VAL.value,
          ticks: {
            color: axisTextColor,
            stepSize: MAX_VAL.value / 4,
            padding: 16,
            font: {
              size: 12,
              weight: 500,
            },
            callback: (value) => String(Math.round(Number(value))),
          },
          grid: {
            color: gridColor,
            tickLength: 0,
          },
          border: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          capBezierPoints: true,
        },
      },
    },
  })
}

watch(
  [currentData, hasChartData],
  () => {
    void renderTaskDoneChart()
  },
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  destroyTaskDoneChart()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const h = d.getHours()
    const m = d.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'pm' : 'am'
    return `${h % 12 || 12}.${m} ${ampm}`
  } catch {
    return '9.00 am'
  }
}

function getProgress(status: string): number {
  switch (status) {
    case 'done':
      return 100
    case 'in_progress':
      return 60
    case 'todo':
      return 24
    case 'cancelled':
      return 10
    default:
      return 0
  }
}

function getProgressClass(status: string): string {
  switch (status) {
    case 'done':
      return 'prog-done'
    case 'in_progress':
      return 'prog-in-progress'
    case 'todo':
      return 'prog-todo'
    default:
      return 'prog-cancelled'
  }
}

async function goToCreateProject() {
  await router.push({ name: 'create-project' })
}
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────────── */
.db-root {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 32px;
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.db-header { display: flex; align-items: flex-start; justify-content: space-between; }
.db-title  { font-size: 1.5rem; font-weight: 700; color: var(--text-heading); margin: 0; }
.db-subtitle { margin: 4px 0 0; font-size: 0.875rem; color: var(--text-subtle); }

/* ── Empty state ────────────────────────────────────────────────────────────── */
.db-empty {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 340px;
  padding: 56px 24px;
  text-align: center;
  background:
    radial-gradient(circle at top, rgba(99, 102, 241, 0.08), transparent 34%),
    linear-gradient(180deg, var(--bg-surface), var(--bg-surface-2));
  border: 1px solid var(--border-base);
  box-shadow: var(--shadow-sm);
}
.db-empty::before {
  content: '';
  position: absolute;
  right: -48px;
  bottom: -64px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.08);
  filter: blur(24px);
  pointer-events: none;
}
.db-empty::after {
  content: '';
  position: absolute;
  top: 24px;
  left: 24px;
  width: 96px;
  height: 96px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), transparent);
  border: 1px solid rgba(255,255,255,0.04);
  opacity: 0.75;
  pointer-events: none;
}
.db-empty-icon  {
  position: relative;
  z-index: 1;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 24px;
  background: linear-gradient(180deg, var(--bg-surface-2), var(--bg-surface-3));
  border: 1px solid var(--border-medium);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-sm);
}
.db-empty-title {
  position: relative;
  z-index: 1;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0;
  letter-spacing: -0.02em;
}
.db-empty-desc  {
  position: relative;
  z-index: 1;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-subtle);
  max-width: 460px;
  margin: 0;
}
.db-empty-btn {
  position: relative;
  z-index: 1;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 1px solid rgba(129,140,248,0.28);
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(99,102,241,0.18);
  transition: transform 0.18s, filter 0.18s, box-shadow 0.18s;
}
.db-empty-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
  box-shadow: 0 16px 34px rgba(99,102,241,0.24);
}
@media (max-width: 640px) {
  .db-empty {
    min-height: 300px;
    padding: 40px 18px;
  }
  .db-empty-icon {
    width: 76px;
    height: 76px;
    font-size: 1.8rem;
  }
  .db-empty-title {
    font-size: 1.25rem;
  }
  .db-empty-desc {
    font-size: 0.875rem;
  }
}

/* ── Stat Cards ────────────────────────────────────────────────────────────── */
.db-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 900px) { .db-stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px)  { .db-stat-grid { grid-template-columns: 1fr; gap: 12px; } }

.db-stat-card {
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 20px 20px 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-base);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s;
}
.db-stat-card:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.10); }
@media (max-width: 540px) { .db-stat-card { padding: 16px; } }

.db-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.db-stat-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.db-stat-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.text-indigo { color: #6366f1; background: rgba(99,102,241,0.12); }
.text-cyan   { color: #06b6d4; background: rgba(6,182,212,0.12); }
.text-rose   { color: #f43f5e; background: rgba(244,63,94,0.12); }

.db-stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
}
.db-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-heading);
  line-height: 1;
  margin-top: 2px;
}

/* Sparkline */
.db-stat-chart { height: 48px; }
.db-sparkline  { width: 100%; height: 100%; display: block; }

/* Footer */
.db-stat-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}
.db-stat-more   { font-weight: 600; }
.db-stat-period { color: var(--text-subtle); }
.indigo-text { color: #6366f1; }
.cyan-text   { color: #06b6d4; }
.rose-text   { color: #f43f5e; }

/* ── Chart Card ────────────────────────────────────────────────────────────── */
.db-chart-card {
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-base) !important;
  box-shadow: var(--shadow-sm) !important;
  padding: 20px 24px 14px;
}
@media (max-width: 540px) { .db-chart-card { padding: 16px 12px 12px; } }

.db-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.db-chart-title { font-size: 1.125rem; font-weight: 700; color: var(--text-heading); margin: 0; }

.db-chart-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-surface-2);
  border-radius: 10px;
  padding: 4px;
}
.db-chart-tab {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-subtle);
  cursor: pointer;
  transition: all 0.18s;
}
.db-chart-tab:hover { color: var(--text-secondary); }
.db-chart-tab.active {
  background: var(--bg-hover);
  color: var(--text-heading);
  font-weight: 600;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.db-chart-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  min-height: 260px;
}
.db-area-chart {
  width: 100%;
  display: block;
  height: 260px !important;
}
@media (max-width: 540px) {
  .db-chart-wrap {
    min-height: 220px;
  }
  .db-area-chart {
    height: 220px !important;
  }
}
.db-chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  border: 1px dashed var(--border-medium);
  border-radius: 12px;
  background: var(--bg-surface-2);
}

.chart-area-path {
  transition: d 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.chart-line {
  transition: d 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.chart-dot {
  transition: cx 0.4s cubic-bezier(0.4, 0, 0.2, 1), cy 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
/* axis text & grid lines use theme vars for both light and dark mode */
.chart-grid-line { stroke: var(--border-soft); }
.chart-axis-text { fill: var(--text-secondary); }
/* dot fill matches surface so they look hollow on any bg */
.chart-dot--indigo { fill: var(--bg-surface); stroke: #6366f1; }
.chart-dot--cyan   { fill: var(--bg-surface); stroke: #06b6d4; }

/* ── Task Section ─────────────────────────────────────────────────────────── */
.db-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0 0 16px;
}

.db-task-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.db-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border-medium);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.db-task-error  { color: #ef4444; font-size: 0.875rem; }
.db-task-empty  { color: var(--text-subtle); font-size: 0.875rem; text-align: center; padding: 40px 20px; }

.db-task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.db-task-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface);
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-base);
  transition: box-shadow 0.2s, transform 0.15s;
  flex-wrap: wrap;
}
.db-task-row:hover {
  background: var(--bg-hover);
  box-shadow: 0 4px 16px rgba(99,102,241,0.10);
  transform: translateY(-1px);
}
@media (max-width: 640px) {
  .db-task-row { padding: 12px 14px; gap: 10px; }
}

/* Play button */
.db-task-play {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,102,241,0.30);
}

/* Time */
.db-task-time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 90px;
}
.db-task-time-label {
  font-size: 0.6875rem;
  color: var(--text-subtle);
  font-weight: 500;
}
.db-task-time-val {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
@media (max-width: 480px) { .db-task-time { display: none; } }

/* Task details */
.db-task-details {
  flex: 1;
  min-width: 0;
}
.db-task-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.db-task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}
.db-task-link, .db-task-comments {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.db-task-link { color: #38bdf8; }
.db-task-comments { color: var(--text-muted); }

/* Progress */
.db-task-progress-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 130px;
}
@media (max-width: 640px) {
  .db-task-progress-col { min-width: 100px; flex: 1; }
}
@media (max-width: 480px) {
  .db-task-progress-col { min-width: unset; width: 100%; }
}
.db-task-progress-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}
.db-task-progress-bar {
  height: 6px;
  background: var(--bg-surface-3);
  border-radius: 99px;
  overflow: hidden;
}
.db-task-progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.prog-done        { background: linear-gradient(90deg, #6366f1, #818cf8); }
.prog-in-progress { background: linear-gradient(90deg, #6366f1, #a5b4fc); }
.prog-todo        { background: linear-gradient(90deg, #06b6d4, #67e8f9); }
.prog-cancelled   { background: var(--border-strong); }

/* Reminder button */
.db-task-reminder {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(129,140,248,0.32);
  background: rgba(99,102,241,0.14);
  color: #a5b4fc;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s, box-shadow 0.15s;
}
.db-task-reminder:hover {
  background: rgba(99,102,241,0.22);
  box-shadow: 0 2px 8px rgba(99,102,241,0.15);
}
@media (max-width: 560px) {
  .db-task-row {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
  }
  .db-task-time {
    display: none;
  }
  .db-task-details {
    grid-column: 2;
    width: 100%;
  }
  .db-task-title {
    white-space: normal;
    line-height: 1.35;
    margin-bottom: 8px;
  }
  .db-task-meta {
    gap: 6px;
  }
  .db-task-link, .db-task-comments {
    font-size: 0.65rem;
  }
  .db-task-progress-col {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    margin-top: 2px;
  }
  .db-task-reminder {
    grid-column: 1 / -1;
    justify-content: center;
    width: 100%;
    margin-top: 2px;
  }
}
</style>
