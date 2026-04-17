<template>
  <div class="flex flex-col gap-6 pb-8">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold m-0" style="color: var(--text-heading);">Dashboard</h2>
        <p class="mt-1 text-sm m-0" style="color: var(--text-subtle);">Manage your workspace and project context from one place.</p>
      </div>
    </div>

    <!-- ── Resolving state ──────────────────────────────────────────── -->
    <div v-if="showProjectResolvingState" class="db-empty card">
      <div class="db-spinner" />
      <h3 class="text-2xl font-bold tracking-tight m-0" style="color: var(--text-heading);">Restoring your last workspace...</h3>
      <p class="text-[0.95rem] leading-[1.7] max-w-[460px] m-0" style="color: var(--text-subtle);">We are checking your most recent project and access permissions.</p>
    </div>

    <!-- ── No project at all ────────────────────────────────────────── -->
    <div v-else-if="!currentProjectId && !hasProjects" class="db-empty card">
      <div class="relative z-10 w-[88px] h-[88px] flex items-center justify-center text-[2rem] rounded-[24px] border" style="background: linear-gradient(180deg, var(--bg-surface-2), var(--bg-surface-3)); border-color: var(--border-medium); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-sm);">🚀</div>
      <h3 class="relative z-10 text-2xl font-bold tracking-[-0.02em] m-0" style="color: var(--text-heading);">No Project Yet</h3>
      <p class="relative z-10 text-[0.95rem] leading-[1.7] max-w-[460px] m-0" style="color: var(--text-subtle);">
        You have not joined any project yet. Create your first project to start tracking tasks.
      </p>
      <button
        class="relative z-10 mt-2 inline-flex items-center justify-center px-[18px] py-3 rounded-xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold cursor-pointer transition-all duration-[180ms] hover:-translate-y-px hover:brightness-105"
        style="box-shadow: 0 12px 28px rgba(99,102,241,0.18);"
        @click="goToCreateProject"
      >
        Create Project
      </button>
    </div>

    <!-- ── Project selected but none chosen ────────────────────────── -->
    <div v-else-if="!currentProjectId" class="db-empty card">
      <div class="relative z-10 w-[88px] h-[88px] flex items-center justify-center text-[2rem] rounded-[24px] border" style="background: linear-gradient(180deg, var(--bg-surface-2), var(--bg-surface-3)); border-color: var(--border-medium); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-sm);">📋</div>
      <h3 class="relative z-10 text-2xl font-bold tracking-[-0.02em] m-0" style="color: var(--text-heading);">No Project Selected</h3>
      <p class="relative z-10 text-[0.95rem] leading-[1.7] max-w-[460px] m-0" style="color: var(--text-subtle);">Please select a project from the header dropdown to view dashboard analytics.</p>
    </div>

    <!-- ── Main Dashboard Content ───────────────────────────────────── -->
    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[540px]:grid-cols-1 max-[540px]:gap-3">

        <!-- Task Completed -->
        <div class="db-stat-card flex flex-col gap-3 rounded-2xl p-5 pb-4 border transition-shadow duration-200 max-[540px]:p-4" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-500 bg-indigo-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <span class="text-[0.8125rem] font-medium" style="color: var(--text-muted);">Task Completed</span>
            </div>
            <span class="text-[1.75rem] font-bold leading-none mt-0.5" style="color: var(--text-heading);">{{ stats.completed }}</span>
          </div>
          <div class="h-12">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="w-full h-full block">
              <defs><linearGradient id="ig1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
              <path d="M0,30 C15,28 20,20 35,22 C50,24 55,16 70,18 C85,20 95,14 120,10 L120,40 L0,40Z" fill="url(#ig1)"/>
              <path d="M0,30 C15,28 20,20 35,22 C50,24 55,16 70,18 C85,20 95,14 120,10" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="font-semibold text-indigo-500">{{ statFooters.completedPrimary }}</span>
            <span style="color: var(--text-subtle);">{{ statFooters.completedSecondary }}</span>
          </div>
        </div>

        <!-- New Task -->
        <div class="db-stat-card flex flex-col gap-3 rounded-2xl p-5 pb-4 border transition-shadow duration-200 max-[540px]:p-4" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 flex items-center justify-center rounded-lg text-cyan-500 bg-cyan-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
              </span>
              <span class="text-[0.8125rem] font-medium" style="color: var(--text-muted);">New Task</span>
            </div>
            <span class="text-[1.75rem] font-bold leading-none mt-0.5" style="color: var(--text-heading);">{{ stats.newTask }}</span>
          </div>
          <div class="h-12">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="w-full h-full block">
              <defs><linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06b6d4" stop-opacity="0.15"/><stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/></linearGradient></defs>
              <path d="M0,28 C10,26 20,22 35,24 C50,26 60,18 75,16 C90,14 100,20 120,12 L120,40 L0,40Z" fill="url(#ig2)"/>
              <path d="M0,28 C10,26 20,22 35,24 C50,26 60,18 75,16 C90,14 100,20 120,12" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="font-semibold text-cyan-500">{{ statFooters.newTaskPrimary }}</span>
            <span style="color: var(--text-subtle);">{{ statFooters.newTaskSecondary }}</span>
          </div>
        </div>

        <!-- Project Done -->
        <div class="db-stat-card flex flex-col gap-3 rounded-2xl p-5 pb-4 border transition-shadow duration-200 max-[540px]:p-4" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 bg-rose-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </span>
              <span class="text-[0.8125rem] font-medium" style="color: var(--text-muted);">Project Done</span>
            </div>
            <span class="text-[1.75rem] font-bold leading-none mt-0.5" style="color: var(--text-heading);">{{ stats.projectDone }}</span>
          </div>
          <div class="h-12">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" class="w-full h-full block">
              <defs><linearGradient id="ig3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f43f5e" stop-opacity="0.12"/><stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/></linearGradient></defs>
              <path d="M0,22 C15,20 25,26 40,18 C55,10 65,24 80,20 C95,16 105,22 120,14 L120,40 L0,40Z" fill="url(#ig3)"/>
              <path d="M0,22 C15,20 25,26 40,18 C55,10 65,24 80,20 C95,16 105,22 120,14" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="font-semibold text-rose-500">{{ statFooters.projectDonePrimary }}</span>
            <span style="color: var(--text-subtle);">{{ statFooters.projectDoneSecondary }}</span>
          </div>
        </div>
      </div>

      <!-- ── Area Chart ──────────────────────────────────────────────── -->
      <div class="card rounded-xl border px-6 py-5 pb-3.5 max-[540px]:px-3 max-[540px]:py-4 max-[540px]:pb-3" style="background: var(--bg-surface) !important; border-color: var(--border-base) !important; box-shadow: var(--shadow-sm) !important;">
        <div class="flex items-center justify-between flex-wrap gap-2.5 mb-4">
          <h3 class="text-lg font-bold m-0" style="color: var(--text-heading);">Task Done</h3>
          <div class="flex gap-1 rounded-[10px] p-1" style="background: var(--bg-surface-2);">
            <button
              v-for="tab in chartTabs"
              :key="tab.value"
              class="px-4 py-1.5 rounded-lg border-none text-[0.8125rem] font-medium cursor-pointer transition-all duration-[180ms]"
              :class="activeTab === tab.value
                ? 'font-semibold underline underline-offset-4'
                : ''"
              :style="activeTab === tab.value
                ? `background: var(--bg-hover); color: var(--text-heading); border: 1px solid var(--border-medium); box-shadow: var(--shadow-sm);`
                : `background: transparent; color: var(--text-subtle);`"
              @click="activeTab = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>

        <div class="relative w-full overflow-hidden min-h-[260px] max-[540px]:min-h-[220px]">
          <canvas
            v-if="hasChartData"
            ref="chartCanvas"
            class="w-full block"
            style="height: 260px !important;"
          />
          <div
            v-else
            class="flex items-center justify-center min-h-[160px] text-sm rounded-xl border border-dashed"
            style="color: var(--text-secondary); border-color: var(--border-medium); background: var(--bg-surface-2);"
          >
            No analytics data available for this period.
          </div>
        </div>
      </div>

      <!-- ── Task List ───────────────────────────────────────────────── -->
      <div>
        <h3 class="text-lg font-bold mb-4 m-0" style="color: var(--text-heading);">Task</h3>

        <div v-if="tasksLoading" class="flex items-center gap-2.5 text-sm" style="color: var(--text-muted);">
          <div class="db-spinner" />
          <span>Loading tasks…</span>
        </div>

        <div v-else-if="tasksError" class="text-sm text-red-500">Failed to load tasks. Please try again.</div>

        <div v-else-if="taskList.length === 0" class="text-sm text-center py-10 px-5" style="color: var(--text-subtle);">
          No tasks assigned for this project yet.
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="task in taskList"
            :key="task.id"
            class="db-task-row flex items-center gap-4 rounded-[14px] px-5 py-4 border transition-all duration-200 flex-wrap max-[640px]:px-3.5 max-[640px]:py-3 max-[640px]:gap-2.5"
            style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);"
          >
            <!-- Play icon -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-400" style="box-shadow: 0 2px 8px rgba(99,102,241,0.30);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>

            <!-- Time info -->
            <div class="flex flex-col gap-1 min-w-[90px] max-[480px]:hidden">
              <span class="text-[0.6875rem] font-medium" style="color: var(--text-subtle);">Start from</span>
              <span class="flex items-center gap-1 text-xs" style="color: var(--text-muted);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                {{ formatTime(task.createdAt) }}
              </span>
            </div>

            <!-- Task details -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold mb-1.5 m-0 whitespace-nowrap overflow-hidden text-ellipsis" style="color: var(--text-primary);">{{ task.title }}</p>
              <div class="flex items-center gap-3 flex-wrap min-w-0">
                <span class="flex items-center gap-1 text-[0.6875rem] text-sky-400 min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  task-link.example.com
                </span>
                <span class="flex items-center gap-1 text-[0.6875rem] min-w-0 max-w-full whitespace-nowrap overflow-hidden text-ellipsis" style="color: var(--text-muted);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  comments unavailable
                </span>
              </div>
            </div>

            <!-- Progress -->
            <div class="flex flex-col gap-1.5 min-w-[130px] max-[640px]:min-w-[100px] max-[640px]:flex-1 max-[480px]:min-w-0 max-[480px]:w-full">
              <span class="text-xs font-semibold" style="color: var(--text-primary);">{{ getProgress(task.status) }}% complete</span>
              <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface-3);">
                <div
                  class="h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  :class="getProgressClass(task.status)"
                  :style="{ width: getProgress(task.status) + '%' }"
                />
              </div>
            </div>

            <!-- Reminder -->
            <button class="db-reminder-btn flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-indigo-400/30 bg-indigo-500/[0.14] text-indigo-300 text-xs font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 transition-all duration-150">
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

Chart.register(LineController, LineElement, LinearScale, CategoryScale, PointElement, Tooltip, Filler)

const router = useRouter()

const projectStore = useProjectStore()
const { currentProjectId, hasProjects, loadingProjects, initialized, projectContextResolved } =
  storeToRefs(projectStore)

const showProjectResolvingState = computed(
  () => !initialized.value || (loadingProjects.value && !projectContextResolved.value)
)

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
  if (!apiData) return { labels: [], series1: [], series2: [] }

  const { labels, totalSeries, completedSeries } = apiData
  const hasValidLength =
    labels.length > 1 && labels.length === totalSeries.length && labels.length === completedSeries.length

  if (!hasValidLength) return { labels: [], series1: [], series2: [] }
  return { labels, series1: completedSeries, series2: totalSeries }
})

const hasChartData = computed(() => currentData.value.labels.length > 1)
const currentLabels = computed(() => currentData.value.labels)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let taskDoneChart: Chart<'line'> | null = null

const MAX_VAL = computed(() => {
  const values = [...currentData.value.series1, ...currentData.value.series2]
  const max = Math.max(...values, 0)
  if (max <= 10) return 10
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const normalized = max / magnitude
  const scale = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return scale * magnitude
})

function getCssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function destroyTaskDoneChart() {
  if (taskDoneChart) { taskDoneChart.destroy(); taskDoneChart = null }
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
        if (!chartArea) return 'rgba(19, 171, 201, 0.18)'
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
  if (!hasChartData.value) { destroyTaskDoneChart(); return }
  await nextTick()
  if (!chartCanvas.value) return

  const axisTextColor = getCssColor('--text-secondary', '#64748b')
  const gridColor = getCssColor('--border-soft', '#e7eef8')
  destroyTaskDoneChart()

  taskDoneChart = new Chart<'line', number[], string>(chartCanvas.value, {
    type: 'line',
    data: { labels: currentLabels.value, datasets: buildChartDatasets() },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 420, easing: 'easeOutCubic' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          displayColors: false,
          padding: 10,
          cornerRadius: 10,
        },
      },
      layout: { padding: { top: 12, right: 12, bottom: 0, left: 8 } },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: axisTextColor, padding: 16, font: { size: 12, weight: 500 } },
        },
        y: {
          min: 0,
          max: MAX_VAL.value,
          ticks: {
            color: axisTextColor,
            stepSize: MAX_VAL.value / 4,
            padding: 16,
            font: { size: 12, weight: 500 },
            callback: (value) => String(Math.round(Number(value))),
          },
          grid: { color: gridColor, tickLength: 0 },
          border: { display: false },
        },
      },
      elements: { line: { capBezierPoints: true } },
    },
  })
}

watch([currentData, hasChartData], () => { void renderTaskDoneChart() }, { immediate: true, deep: true })
onBeforeUnmount(() => { destroyTaskDoneChart() })

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
    case 'done': return 100
    case 'in_progress': return 60
    case 'todo': return 24
    case 'cancelled': return 10
    default: return 0
  }
}

function getProgressClass(status: string): string {
  switch (status) {
    case 'done': return 'bg-gradient-to-r from-indigo-500 to-indigo-400'
    case 'in_progress': return 'bg-gradient-to-r from-indigo-500 to-indigo-300'
    case 'todo': return 'bg-gradient-to-r from-cyan-500 to-cyan-300'
    default: return 'bg-slate-300'
  }
}

async function goToCreateProject() {
  await router.push({ name: 'create-project' })
}
</script>

<style scoped>
/* 1. Empty state card — ::before & ::after pseudo-elements + CSS-variable gradients */
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
    radial-gradient(circle at top, rgba(99,102,241,0.08), transparent 34%),
    linear-gradient(180deg, var(--bg-surface), var(--bg-surface-2));
  border: 1px solid var(--border-base);
  box-shadow: var(--shadow-sm);
}
.db-empty::before {
  content: '';
  position: absolute;
  right: -48px; bottom: -64px;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: rgba(99,102,241,0.08);
  filter: blur(24px);
  pointer-events: none;
}
.db-empty::after {
  content: '';
  position: absolute;
  top: 24px; left: 24px;
  width: 96px; height: 96px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), transparent);
  border: 1px solid rgba(255,255,255,0.04);
  opacity: 0.75;
  pointer-events: none;
}
@media (max-width: 640px) {
  .db-empty { min-height: 300px; padding: 40px 18px; }
}

/* 2. Stat card hover with CSS-variable shadow */
.db-stat-card:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.10); }

/* 3. Task row hover with CSS-variable colors */
.db-task-row:hover {
  background: var(--bg-hover) !important;
  box-shadow: 0 4px 16px rgba(99,102,241,0.10);
  transform: translateY(-1px);
}

/* 4. Reminder button hover */
.db-reminder-btn:hover {
  background: rgba(99,102,241,0.22);
  box-shadow: 0 2px 8px rgba(99,102,241,0.15);
}

/* 5. Spinner — @keyframes */
.db-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border-medium);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 6. Chart canvas fixed height at small screens */
@media (max-width: 540px) {
  canvas[ref="chartCanvas"] { height: 220px !important; }
}
</style>
