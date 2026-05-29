<template>
  <div class="flex flex-col gap-6 pb-8">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="page-title" style="color: var(--text-heading);">Reports &amp; Analytics</h2>
        <p class="page-subtitle" style="color: var(--text-subtle);">Track project performance, task progress, and team productivity.</p>
      </div>

      <!-- Filters row -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Project dropdown -->
        <div class="relative" ref="projectDropRef">
          <button
            class="rpt-filter-btn"
            @click="projectDropOpen = !projectDropOpen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8.25A2.25 2.25 0 0 1 6.25 6h3.6l1.95 2.2h5.95A2.25 2.25 0 0 1 20 10.45v6.3A2.25 2.25 0 0 1 17.75 19H6.25A2.25 2.25 0 0 1 4 16.75z"/></svg>
            <span class="truncate max-w-[110px]">{{ selectedProjectLabel }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <Transition name="rpt-drop">
            <div v-if="projectDropOpen" class="rpt-dropdown" @click.stop>
              <button
                v-for="p in projectOptions" :key="p.id"
                class="rpt-dropdown-item"
                :class="selectedProjectId === p.id ? 'rpt-dropdown-item--active' : ''"
                @click="selectedProjectId = p.id; selectedSprintId = ''; projectDropOpen = false"
              >{{ p.name }}</button>
            </div>
          </Transition>
        </div>

        <!-- Sprint dropdown -->
        <div class="relative" ref="sprintDropRef">
          <button class="rpt-filter-btn" @click="sprintDropOpen = !sprintDropOpen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span class="truncate max-w-[110px]">{{ selectedSprintLabel }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <Transition name="rpt-drop">
            <div v-if="sprintDropOpen" class="rpt-dropdown" @click.stop>
              <button
                v-for="s in sprintOptions" :key="s.id"
                class="rpt-dropdown-item"
                :class="selectedSprintId === s.id ? 'rpt-dropdown-item--active' : ''"
                @click="selectedSprintId = s.id; sprintDropOpen = false"
              >{{ s.name }}</button>
            </div>
          </Transition>
        </div>

        <!-- Date Range -->
        <button class="rpt-filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{{ dateRange }}</span>
        </button>

        <!-- Export -->
        <button class="rpt-export-btn" :disabled="reportQuery.isFetching.value" @click="handleExport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>
    </div>

    <div v-if="reportQuery.isFetching.value" class="rpt-card py-4 text-sm" style="color: var(--text-subtle);">
      Loading report data...
    </div>
    <div v-else-if="reportQuery.isError.value" class="rpt-card py-4 text-sm text-red-400">
      Cannot load report data. Please try again.
    </div>

    <!-- ── Summary Cards ───────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="rpt-stat-card"
        :style="`--accent: ${card.color};`"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="rpt-stat-icon" :style="`background:${card.color}18; color:${card.color};`">
            <span v-html="card.icon" />
          </div>
          <span class="rpt-stat-trend" :class="card.trendUp ? 'rpt-trend-up' : 'rpt-trend-down'">
            <svg v-if="card.trendUp" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>
            <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            {{ card.trend }}
          </span>
        </div>
        <div class="rpt-stat-value" :style="`color: ${card.color};`">{{ card.value }}</div>
        <div class="rpt-stat-label">{{ card.label }}</div>
        <div class="rpt-stat-note">{{ card.note }}</div>
        <!-- Mini sparkline bar -->
        <div class="mt-3 h-1 rounded-full overflow-hidden" style="background: var(--bg-surface-3);">
          <div class="h-full rounded-full transition-all duration-700" :style="`width:${card.pct}%; background:${card.color};`" />
        </div>
      </div>
    </div>

    <!-- ── Charts Row ──────────────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

      <!-- A. Task by Status -->
      <div class="rpt-card">
        <div class="rpt-card-header">
          <h3 class="rpt-card-title">Task by Status</h3>
          <span class="rpt-badge rpt-badge-purple">{{ totalByStatus }} tasks</span>
        </div>
        <div class="flex flex-col gap-2.5 mt-1">
          <div v-for="item in taskByStatus" :key="item.label" class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background:${item.color};`" />
                <span style="color: var(--text-secondary);">{{ item.label }}</span>
              </div>
              <span class="font-semibold tabular-nums" style="color: var(--text-heading);">{{ item.count }}</span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-3);">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="`width:${statusPct(item.count)}%; background:${item.color};`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- B. Task by Priority -->
      <div class="rpt-card">
        <div class="rpt-card-header">
          <h3 class="rpt-card-title">Task by Priority</h3>
          <span class="rpt-badge rpt-badge-cyan">{{ totalByPriority }} tasks</span>
        </div>
        <div class="flex flex-col gap-2.5 mt-1">
          <div v-for="item in taskByPriority" :key="item.label" class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background:${item.color};`" />
                <span style="color: var(--text-secondary);">{{ item.label }}</span>
              </div>
              <span class="font-semibold tabular-nums" style="color: var(--text-heading);">{{ item.count }}</span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-3);">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="`width:${priorityPct(item.count)}%; background:${item.color};`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- D. Sprint Progress -->
      <div class="rpt-card">
        <div class="rpt-card-header">
          <h3 class="rpt-card-title">Sprint Progress</h3>
          <span class="rpt-badge rpt-badge-green">Active</span>
        </div>
        <div class="flex flex-col gap-4 mt-1">
          <div v-for="sprint in sprintProgressData" :key="sprint.name" class="rpt-sprint-block">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] font-semibold" style="color: var(--text-heading);">{{ sprint.name }}</span>
              <span class="text-[12px] font-bold" :style="`color: ${sprintProgressColor(sprint.pct)};`">{{ sprint.pct }}%</span>
            </div>
            <div class="h-2.5 rounded-full overflow-hidden mb-2" style="background: var(--bg-surface-3);">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="`width:${sprint.pct}%; background:linear-gradient(90deg,${sprintProgressColor(sprint.pct)},${sprintProgressColor2(sprint.pct)});`"
              />
            </div>
            <div class="flex items-center gap-3 text-[11px]" style="color: var(--text-muted);">
              <span><span class="font-semibold" style="color: var(--text-secondary);">{{ sprint.total }}</span> total</span>
              <span class="text-emerald-500 font-semibold">✓ {{ sprint.done }}</span>
              <span class="text-amber-400 font-semibold">◷ {{ sprint.remaining }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Task Completed Over Time Chart ──────────────────────── -->
    <div class="rpt-card">
      <div class="rpt-card-header flex-wrap gap-3">
        <div>
          <h3 class="rpt-card-title">Task Completed Over Time</h3>
          <p class="text-[12px] mt-0.5 m-0" style="color: var(--text-subtle);">Tasks completed in the selected period</p>
        </div>
        <div class="flex gap-1 rounded-[10px] p-1" style="background: var(--bg-surface-2);">
          <button
            v-for="tab in chartPeriodTabs"
            :key="tab.value"
            class="px-4 py-1.5 rounded-lg border-none text-[0.8125rem] font-medium cursor-pointer transition-all duration-[180ms]"
            :style="activeChartPeriod === tab.value
              ? 'background: var(--bg-hover); color: var(--text-heading); border: 1px solid var(--border-medium); box-shadow: var(--shadow-sm);'
              : 'background: transparent; color: var(--text-subtle);'"
            @click="setChartPeriod(tab.value)"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="relative w-full mt-4" style="height: 240px;">
        <canvas ref="completionChartCanvas" />
      </div>
    </div>

    <!-- ── Tables Row ──────────────────────────────────────────── -->
    <!-- Table 1: Overdue Tasks -->
    <div class="rpt-card overflow-hidden">
      <div class="rpt-card-header mb-0 pb-4" style="border-bottom: 1px solid var(--border-base);">
        <div>
          <h3 class="rpt-card-title">Overdue Tasks</h3>
          <p class="text-[12px] mt-0.5 m-0" style="color: var(--text-subtle);">Tasks that have passed their due date</p>
        </div>
        <span class="rpt-badge" style="background: rgba(239,68,68,0.12); color: #f87171;">{{ overdueTasks.length }} overdue</span>
      </div>

      <!-- Empty state -->
      <div v-if="overdueTasks.length === 0" class="rpt-empty-state">
        <div class="rpt-empty-icon" style="background: rgba(16,185,129,0.1); color: #10b981;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <p class="font-semibold m-0" style="color: var(--text-heading);">No overdue tasks!</p>
        <p class="text-[13px] m-0" style="color: var(--text-subtle);">All tasks are on track. Great job!</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full" style="border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-base);">
              <th class="rpt-th text-left">Task Name</th>
              <th class="rpt-th text-left">Assignee</th>
              <th class="rpt-th text-left">Priority</th>
              <th class="rpt-th text-left">Due Date</th>
              <th class="rpt-th text-left">Status</th>
              <th class="rpt-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="task in overdueTasks"
              :key="task.id"
              class="rpt-table-row"
            >
              <td class="rpt-td">
                <div class="flex items-center gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-500" />
                  <span class="text-[13px] font-semibold truncate max-w-[200px]" style="color: var(--text-heading);">{{ task.title }}</span>
                </div>
              </td>
              <td class="rpt-td">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    :style="`background: ${avatarColor(task.assignee)};`">
                    {{ initials(task.assignee) }}
                  </div>
                  <span class="text-[12.5px] truncate max-w-[110px]" style="color: var(--text-secondary);">{{ task.assignee }}</span>
                </div>
              </td>
              <td class="rpt-td">
                <span class="rpt-priority-badge" :class="`rpt-prio-${task.priority.toLowerCase()}`">{{ task.priority }}</span>
              </td>
              <td class="rpt-td">
                <span class="text-[12.5px] font-semibold text-red-400">{{ task.dueDate ? formatShortDate(new Date(task.dueDate)) : '' }}</span>
              </td>
              <td class="rpt-td">
                <span class="rpt-status-badge rpt-status-overdue">Overdue</span>
              </td>
              <td class="rpt-td text-right">
                <button class="rpt-open-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v7H3V3h7"/></svg>
                  Open
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Table 2: Member Performance -->
    <div class="rpt-card overflow-hidden">
      <div class="rpt-card-header mb-0 pb-4" style="border-bottom: 1px solid var(--border-base);">
        <div>
          <h3 class="rpt-card-title">Member Performance</h3>
          <p class="text-[12px] mt-0.5 m-0" style="color: var(--text-subtle);">Individual productivity across the project</p>
        </div>
        <span class="rpt-badge rpt-badge-purple">{{ memberPerformance.length }} members</span>
      </div>

      <!-- Empty state -->
      <div v-if="memberPerformance.length === 0" class="rpt-empty-state">
        <div class="rpt-empty-icon" style="background: rgba(99,102,241,0.1); color: #6366f1;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p class="font-semibold m-0" style="color: var(--text-heading);">No members found</p>
        <p class="text-[13px] m-0" style="color: var(--text-subtle);">Add members to your project to track performance here.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" style="border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-base);">
              <th class="rpt-th text-left">Member</th>
              <th class="rpt-th text-left">Role</th>
              <th class="rpt-th text-center">Assigned</th>
              <th class="rpt-th text-center">Completed</th>
              <th class="rpt-th text-center">Overdue</th>
              <th class="rpt-th text-left">Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="member in memberPerformance"
              :key="member.id"
              class="rpt-table-row"
            >
              <td class="rpt-td">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    :style="`background: ${avatarColor(member.name)};`">
                    {{ initials(member.name) }}
                  </div>
                  <div>
                    <p class="text-[13px] font-semibold m-0" style="color: var(--text-heading);">{{ member.name }}</p>
                    <p class="text-[11px] m-0" style="color: var(--text-subtle);">{{ member.email }}</p>
                  </div>
                </div>
              </td>
              <td class="rpt-td">
                <span class="rpt-role-badge" :class="member.role === 'Owner' ? 'rpt-role-owner' : 'rpt-role-member'">{{ member.role }}</span>
              </td>
              <td class="rpt-td text-center">
                <span class="text-[13px] font-bold tabular-nums" style="color: var(--text-heading);">{{ member.assigned }}</span>
              </td>
              <td class="rpt-td text-center">
                <span class="text-[13px] font-bold tabular-nums text-emerald-500">{{ member.completed }}</span>
              </td>
              <td class="rpt-td text-center">
                <span class="text-[13px] font-bold tabular-nums" :class="member.overdue > 0 ? 'text-red-400' : 'text-emerald-500'">{{ member.overdue }}</span>
              </td>
              <td class="rpt-td">
                <div class="flex items-center gap-2.5 min-w-[120px]">
                  <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-3);">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      :style="`width:${member.rate}%; background:${memberRateColor(member.rate)};`"
                    />
                  </div>
                  <span class="text-[12px] font-bold tabular-nums w-9 text-right" :style="`color:${memberRateColor(member.rate)};`">{{ member.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartDataset,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { listProjectSprints, type SprintSummary } from '@/api/sprints'
import { getTaskReport, type ReportPeriod } from '@/api/reports'
import { useProjectsQuery } from '@/api/projects'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useToast } from '@/composables/useToast'
import { useProjectStore } from '@/stores/project.store'
import { useQuery } from '@tanstack/vue-query'
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ── Mock Data ────────────────────────────────────────────────────────────
const toast = useToast()
const projectStore = useProjectStore()
const projectsQuery = useProjectsQuery()

const selectedProjectId = ref(projectStore.currentProjectId ?? '')
const selectedSprintId = ref('')
const reportMonth = ref(toMonthInputValue(new Date()))
const projectDropOpen = ref(false)
const sprintDropOpen = ref(false)
const projectDropRef = ref<HTMLElement | null>(null)
const sprintDropRef = ref<HTMLElement | null>(null)

const loadedSprints = ref<SprintSummary[]>([])
const projectOptions = computed(() => [
  { id: '', name: 'All Projects' },
  ...(projectsQuery.data.value ?? []),
])
const sprintOptions = computed(() => [
  { id: '', name: 'All Sprints' },
  ...loadedSprints.value.map((sprint) => ({ id: sprint.id, name: sprint.name })),
])
const selectedProjectLabel = computed(() =>
  projectOptions.value.find((project) => project.id === selectedProjectId.value)?.name ?? 'All Projects'
)
const selectedSprintLabel = computed(() =>
  sprintOptions.value.find((sprint) => sprint.id === selectedSprintId.value)?.name ?? 'All Sprints'
)
const dateRange = computed(() => {
  const [year, month] = reportMonth.value.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return `${formatShortDate(start)} - ${formatShortDate(end)}`
})

function onClickOutside(e: MouseEvent) {
  if (projectDropRef.value && !projectDropRef.value.contains(e.target as Node))
    projectDropOpen.value = false
  if (sprintDropRef.value && !sprintDropRef.value.contains(e.target as Node))
    sprintDropOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

watch(
  selectedProjectId,
  async (projectId) => {
    selectedSprintId.value = ''

    if (!projectId) {
      loadedSprints.value = []
      return
    }

    try {
      loadedSprints.value = await listProjectSprints(projectId)
    } catch {
      loadedSprints.value = []
      toast.error('Cannot load sprints for this project')
    }
  },
  { immediate: true }
)

// ── Summary Cards ────────────────────────────────────────────────────────
const summaryCards = computed(() => [
  {
    label: 'Total Tasks',
    value: String(reportData.value?.summary.totalTasks ?? 0),
    note: 'Across all statuses',
    color: '#6366f1',
    pct: 100,
    trend: '+12%',
    trendUp: true,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>`,
  },
  {
    label: 'Completed Tasks',
    value: String(reportData.value?.summary.completedTasks ?? 0),
    note: 'Done in selected scope',
    color: '#10b981',
    pct: 65,
    trend: '+8%',
    trendUp: true,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  },
  {
    label: 'Overdue Tasks',
    value: String(reportData.value?.summary.overdueTasks ?? 0),
    note: 'Needs immediate attention',
    color: '#ef4444',
    pct: 10,
    trend: '+2',
    trendUp: false,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  },
  {
    label: 'Completion Rate',
    value: `${reportData.value?.summary.completionRate ?? 0}%`,
    note: 'Completed / total',
    color: '#f59e0b',
    pct: 65,
    trend: '+6.6%',
    trendUp: true,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
])

// ── Task by Status ───────────────────────────────────────────────────────
const taskByStatus = computed(() => reportData.value?.taskByStatus ?? [])
const totalByStatus = computed(() => taskByStatus.value.reduce((s, i) => s + i.count, 0))
function statusPct(count: number) {
  return totalByStatus.value ? Math.round((count / totalByStatus.value) * 100) : 0
}

// ── Task by Priority ─────────────────────────────────────────────────────
const taskByPriority = computed(() => reportData.value?.taskByPriority ?? [])
const totalByPriority = computed(() => taskByPriority.value.reduce((s, i) => s + i.count, 0))
function priorityPct(count: number) {
  return totalByPriority.value ? Math.round((count / totalByPriority.value) * 100) : 0
}

// ── Sprint Progress ──────────────────────────────────────────────────────
const sprintProgress = [
  { name: 'Sprint 1 – Foundation',    total: 18, done: 18, remaining: 0 },
  { name: 'Sprint 2 – Core Features', total: 20, done: 15, remaining: 5 },
  { name: 'Sprint 3 – Polish (Current)', total: 16, done: 6, remaining: 10 },
]
// compute pct on derived prop
const sprintProgressData = computed(() =>
  (reportData.value?.sprintProgress ?? sprintProgress).map((s) => ({
    ...s,
    pct: s.total ? Math.round((s.done / s.total) * 100) : 0,
  }))
)

function sprintProgressColor(pct: number) {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return '#6366f1'
  return '#f59e0b'
}
function sprintProgressColor2(pct: number) {
  if (pct >= 80) return '#34d399'
  if (pct >= 50) return '#818cf8'
  return '#fbbf24'
}

// ── Chart: Task Completed Over Time ─────────────────────────────────────
type Period = ReportPeriod
const chartPeriodTabs = [
  { label: 'Daily', value: 'daily' as Period },
  { label: 'Weekly', value: 'weekly' as Period },
  { label: 'Monthly', value: 'monthly' as Period },
]
const activeChartPeriod = ref<Period>('weekly')

const reportParams = computed(() => ({
  period: activeChartPeriod.value,
  month: reportMonth.value,
  ...(selectedProjectId.value ? { projectId: selectedProjectId.value } : {}),
  ...(selectedSprintId.value ? { sprintId: selectedSprintId.value } : {}),
}))

const reportQuery = useQuery({
  queryKey: computed(() => QUERY_KEYS.taskAnalytics.report(reportParams.value)),
  queryFn: () => getTaskReport(reportParams.value),
})
const reportData = computed(() => reportQuery.data.value)

async function handleExport() {
  if (!reportData.value) {
    toast.error('Report data is not ready yet')
    return
  }

  exportReportToExcel()
  toast.success('Report exported')
}

const chartDatasets: Record<Period, { labels: string[]; data: number[] }> = {
  daily: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [2, 4, 3, 6, 5, 1, 2],
  },
  weekly: {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
    data: [8, 13, 10, 16, 12],
  },
  monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [14, 22, 18, 30, 26, 31],
  },
}

const completionChartCanvas = ref<HTMLCanvasElement | null>(null)
let completionChart: Chart<'bar'> | null = null

function destroyCompletionChart() {
  if (completionChart) {
    completionChart.destroy()
    completionChart = null
  }
}

function getCssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

async function renderCompletionChart() {
  await nextTick()
  if (!completionChartCanvas.value) return
  destroyCompletionChart()

  const axisTextColor = getCssColor('--text-secondary', '#64748b')
  const gridColor = getCssColor('--border-soft', '#252838')
  const fallbackDataset = chartDatasets[activeChartPeriod.value]
  const labels = reportData.value?.completionChart.labels ?? fallbackDataset.labels
  const data = reportData.value?.completionChart.completedSeries ?? fallbackDataset.data

  const datasets: ChartDataset<'bar', number[]>[] = [
    {
      label: 'Completed Tasks',
      data,
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { chartArea, ctx: c } = chart
        if (!chartArea) return 'rgba(99,102,241,0.7)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(139,92,246,0.85)')
        gradient.addColorStop(1, 'rgba(99,102,241,0.45)')
        return gradient
      },
      borderColor: '#6366f1',
      borderWidth: 0,
      borderRadius: 8,
      borderSkipped: false,
    },
  ]

  completionChart = new Chart<'bar', number[], string>(completionChartCanvas.value, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450, easing: 'easeOutCubic' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          padding: 10,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} tasks completed`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: axisTextColor, font: { size: 12, weight: 500 }, padding: 8 },
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          border: { display: false },
          ticks: {
            color: axisTextColor,
            font: { size: 12, weight: 500 },
            padding: 12,
            callback: (v) => String(v),
          },
        },
      },
    },
  })
}

function setChartPeriod(p: Period) {
  activeChartPeriod.value = p
}

watch([activeChartPeriod, reportData], () => { void renderCompletionChart() }, { immediate: false })
onMounted(() => { void renderCompletionChart() })
onBeforeUnmount(() => { destroyCompletionChart() })

// ── Overdue Tasks Table ──────────────────────────────────────────────────
const mockOverdueTasks = [
  { id: '1', title: 'Design system tokens documentation', assignee: 'Anh Nguyen', priority: 'Urgent', dueDate: 'May 10, 2026', status: 'overdue' },
  { id: '2', title: 'API rate limiting middleware',       assignee: 'Minh Tran',   priority: 'High',   dueDate: 'May 14, 2026', status: 'overdue' },
  { id: '3', title: 'Mobile responsive layout fixes',    assignee: 'Linh Pham',   priority: 'High',   dueDate: 'May 18, 2026', status: 'overdue' },
  { id: '4', title: 'Unit tests for auth module',        assignee: 'Dat Le',       priority: 'Medium', dueDate: 'May 20, 2026', status: 'overdue' },
  { id: '5', title: 'Performance audit & optimisation',  assignee: 'Anh Nguyen',  priority: 'Medium', dueDate: 'May 22, 2026', status: 'overdue' },
]

// ── Member Performance Table ─────────────────────────────────────────────
const mockMemberPerformance = [
  { id: '1', name: 'Anh Nguyen',  email: 'anh@octom.io',   role: 'Owner',  assigned: 16, completed: 12, overdue: 2, rate: 75 },
  { id: '2', name: 'Minh Tran',   email: 'minh@octom.io',  role: 'Member', assigned: 12, completed: 11, overdue: 1, rate: 91 },
  { id: '3', name: 'Linh Pham',   email: 'linh@octom.io',  role: 'Member', assigned: 10, completed: 6,  overdue: 1, rate: 60 },
  { id: '4', name: 'Dat Le',      email: 'dat@octom.io',   role: 'Member', assigned: 8,  completed: 8,  overdue: 1, rate: 100 },
  { id: '5', name: 'Thu Hoang',   email: 'thu@octom.io',   role: 'Member', assigned: 4,  completed: 2,  overdue: 0, rate: 50 },
]

const overdueTasks = computed(() => reportData.value?.overdueTasks ?? mockOverdueTasks)
const memberPerformance = computed(() => reportData.value?.memberPerformance ?? mockMemberPerformance)

function memberRateColor(rate: number) {
  if (rate >= 85) return '#10b981'
  if (rate >= 60) return '#6366f1'
  return '#f59e0b'
}

// ── Helpers ──────────────────────────────────────────────────────────────
function toMonthInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sheetTable(title: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return `<h2>${escapeHtml(title)}</h2><p>No data</p>`
  }

  const headers = Object.keys(rows[0])
  const thead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const tbody = rows
    .map((row) =>
      `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`
    )
    .join('')

  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
}

function exportReportToExcel() {
  const report = reportData.value
  if (!report) return

  const workbookHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-family: Arial, sans-serif; font-size: 12px; }
          th { background: #eef2ff; font-weight: 700; }
          h1, h2, p { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <h1>Reports & Analytics</h1>
        <p>Project: ${escapeHtml(selectedProjectLabel.value)}</p>
        <p>Sprint: ${escapeHtml(selectedSprintLabel.value)}</p>
        <p>Period: ${escapeHtml(dateRange.value)}</p>
        <p>Generated: ${escapeHtml(formatShortDate(new Date(report.generatedAt)))}</p>
        ${sheetTable('Summary', [
          {
            'Total Tasks': report.summary.totalTasks,
            'Completed Tasks': report.summary.completedTasks,
            'Overdue Tasks': report.summary.overdueTasks,
            'Completion Rate': `${report.summary.completionRate}%`,
          },
        ])}
        ${sheetTable('Task By Status', report.taskByStatus.map((item) => ({
          Status: item.label,
          Count: item.count,
        })))}
        ${sheetTable('Task By Priority', report.taskByPriority.map((item) => ({
          Priority: item.label,
          Count: item.count,
        })))}
        ${sheetTable('Sprint Progress', report.sprintProgress.map((item) => ({
          Sprint: item.name,
          Total: item.total,
          Done: item.done,
          Remaining: item.remaining,
          Progress: `${item.total ? Math.round((item.done / item.total) * 100) : 0}%`,
        })))}
        ${sheetTable('Overdue Tasks', report.overdueTasks.map((task) => ({
          Task: task.title,
          Assignee: task.assignee,
          Priority: task.priority,
          'Due Date': task.dueDate ? formatShortDate(new Date(task.dueDate)) : '',
          Status: task.status,
          Project: task.project,
        })))}
        ${sheetTable('Member Performance', report.memberPerformance.map((member) => ({
          Member: member.name,
          Email: member.email,
          Role: member.role,
          Assigned: member.assigned,
          Completed: member.completed,
          Overdue: member.overdue,
          'Completion Rate': `${member.rate}%`,
        })))}
      </body>
    </html>
  `

  const blob = new Blob([workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `reports-${reportMonth.value}.xls`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#3b82f6',
]
function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
}
</script>

<style scoped>
/* ── Filter Buttons ──────────────────────────────────────────────── */
.rpt-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1.5px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}
.rpt-filter-btn:hover {
  border-color: #818cf8;
  background: var(--bg-hover);
  color: var(--text-heading);
}

.rpt-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s;
  box-shadow: 0 3px 12px rgba(99,102,241,0.3);
}
.rpt-export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 18px rgba(99,102,241,0.4);
}

/* ── Dropdown ──────────────────────────────────────────────────────── */
.rpt-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  border-radius: 14px;
  border: 1.5px solid var(--border-base);
  background: var(--dropdown-bg);
  box-shadow: var(--shadow-lg);
  z-index: 200;
  padding: 6px;
  overflow: hidden;
}
.rpt-dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s;
}
.rpt-dropdown-item:hover { background: var(--dropdown-item-hover); color: var(--text-heading); }
.rpt-dropdown-item--active { background: var(--bg-active); color: #6366f1; font-weight: 700; }

.rpt-drop-enter-active { animation: rptDropIn 0.16s cubic-bezier(0.34,1.1,0.64,1); }
.rpt-drop-leave-active { animation: rptDropIn 0.12s ease reverse; }
@keyframes rptDropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Summary Cards ─────────────────────────────────────────────────── */
.rpt-stat-card {
  border-radius: 20px;
  border: 1.5px solid var(--border-base);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  transition: all 0.22s;
  position: relative;
  overflow: hidden;
}
.rpt-stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: radial-gradient(circle at top right, var(--accent, #6366f1) 0%, transparent 70%);
  opacity: 0.04;
  pointer-events: none;
}
.rpt-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-medium);
}

.rpt-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rpt-stat-icon :deep(svg) { display: block; }

.rpt-stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}
.rpt-trend-up   { background: rgba(16,185,129,0.12); color: #10b981; }
.rpt-trend-down { background: rgba(239,68,68,0.12);  color: #ef4444; }

.rpt-stat-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-top: 10px;
  letter-spacing: -0.02em;
}
.rpt-stat-label {
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
  color: var(--text-muted);
}
.rpt-stat-note {
  font-size: 11.5px;
  margin-top: 2px;
  color: var(--text-subtle);
}

/* ── Card ──────────────────────────────────────────────────────────── */
.rpt-card {
  border-radius: 20px;
  border: 1.5px solid var(--border-base);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  padding: 22px;
}

.rpt-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.rpt-card-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text-heading);
}

/* ── Badges ────────────────────────────────────────────────────────── */
.rpt-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.rpt-badge-purple { background: rgba(99,102,241,0.12); color: #818cf8; }
.rpt-badge-cyan   { background: rgba(6,182,212,0.12);  color: #22d3ee; }
.rpt-badge-green  { background: rgba(16,185,129,0.12); color: #34d399; }

/* ── Sprint block ──────────────────────────────────────────────────── */
.rpt-sprint-block {
  padding: 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border-base);
  background: var(--bg-surface-2);
  transition: border-color 0.15s;
}
.rpt-sprint-block:hover { border-color: var(--border-medium); }

/* ── Table ─────────────────────────────────────────────────────────── */
.rpt-th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--text-muted);
}
.rpt-td {
  padding: 13px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-base);
  vertical-align: middle;
  color: var(--text-secondary);
}
.rpt-table-row { transition: background 0.12s; }
.rpt-table-row:hover td { background: var(--bg-hover); }
.rpt-table-row:last-child td { border-bottom: none; }

/* ── Status Badge ──────────────────────────────────────────────────── */
.rpt-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.rpt-status-overdue { background: rgba(239,68,68,0.12); color: #f87171; }

/* ── Priority Badge ────────────────────────────────────────────────── */
.rpt-priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.rpt-prio-urgent { background: rgba(239,68,68,0.14); color: #f87171; }
.rpt-prio-high   { background: rgba(245,158,11,0.14); color: #fbbf24; }
.rpt-prio-medium { background: rgba(99,102,241,0.14); color: #818cf8; }
.rpt-prio-low    { background: rgba(16,185,129,0.14); color: #34d399; }

/* ── Role Badge ────────────────────────────────────────────────────── */
.rpt-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.rpt-role-owner  { background: rgba(139,92,246,0.12); color: #a78bfa; }
.rpt-role-member { background: rgba(148,163,184,0.1); color: var(--text-muted); }

/* ── Open Button ───────────────────────────────────────────────────── */
.rpt-open-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--border-medium);
  background: var(--bg-surface-2);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.rpt-open-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99,102,241,0.08);
}

/* ── Empty State ───────────────────────────────────────────────────── */
.rpt-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
}
.rpt-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
</style>
