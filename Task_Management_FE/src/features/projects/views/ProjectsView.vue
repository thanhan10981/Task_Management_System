<template>
  <section class="flex flex-col gap-5 pb-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div class="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-indigo-500" style="background: var(--bg-active); border-color: var(--border-medium);">
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Workspace
        </div>
        <h1 class="page-title" style="color: var(--text-heading);">My Projects</h1>
        <p class="page-subtitle" style="color: var(--text-subtle);">Manage every project you own or participate in.</p>
      </div>

      <button class="gradient-btn h-11 px-5" type="button" @click="goToCreateProject">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Project
      </button>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-2xl border p-4"
        style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold" style="color: var(--text-subtle);">{{ stat.label }}</span>
          <span class="flex h-8 w-8 items-center justify-center rounded-xl" :class="stat.iconClass" v-html="stat.icon" />
        </div>
        <p class="mt-3 text-2xl font-bold leading-none" style="color: var(--text-heading);">{{ stat.value }}</p>
        <p class="mt-1 text-xs" style="color: var(--text-muted);">{{ stat.caption }}</p>
      </div>
    </div>

    <div class="rounded-2xl border p-4" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div class="relative flex-1">
          <svg class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="search"
            type="search"
            class="h-11 w-full rounded-xl border-[1.5px] bg-transparent pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            style="border-color: var(--border-medium); background: var(--bg-surface-2); color: var(--text-primary);"
            placeholder="Search projects by name or description"
          >
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in roleFilters"
            :key="option.value"
            type="button"
            class="h-10 rounded-xl border px-3 text-xs font-bold transition"
            :class="roleFilter === option.value ? 'text-white' : ''"
            :style="roleFilter === option.value
              ? 'background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent;'
              : 'background: var(--bg-surface-2); border-color: var(--border-medium); color: var(--text-muted);'"
            @click="roleFilter = option.value"
          >
            {{ option.label }}
          </button>
          <select
            v-model="statusFilter"
            class="h-10 rounded-xl border-[1.5px] px-3 text-xs font-bold outline-none"
            style="background: var(--bg-surface-2); border-color: var(--border-medium); color: var(--text-muted);"
          >
            <option value="all">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loadingProjects" class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="index in 6"
        :key="index"
        class="h-56 animate-pulse rounded-2xl border"
        style="background: var(--bg-surface); border-color: var(--border-base);"
      />
    </div>

    <div
      v-else-if="filteredProjects.length === 0"
      class="empty-state-wrapper relative overflow-hidden rounded-2xl border border-dashed px-6 py-16 text-center"
      style="background: var(--bg-surface); border-color: var(--border-medium);"
    >
      <!-- Ambient glow blobs -->
      <div class="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div class="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/5 blur-2xl" />

      <!-- Floating decorative dots -->
      <span class="empty-dot empty-dot-1 pointer-events-none absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-indigo-400/30" />
      <span class="empty-dot empty-dot-2 pointer-events-none absolute right-[15%] top-[25%] h-1.5 w-1.5 rounded-full bg-violet-400/40" />
      <span class="empty-dot empty-dot-3 pointer-events-none absolute bottom-[22%] left-[20%] h-1 w-1 rounded-full bg-cyan-400/40" />
      <span class="empty-dot empty-dot-4 pointer-events-none absolute bottom-[18%] right-[12%] h-2.5 w-2.5 rounded-full bg-indigo-300/20" />

      <div class="relative flex flex-col items-center">
        <!-- Icon with layered ring effect -->
        <div class="empty-icon-ring relative mb-6 flex h-20 w-20 items-center justify-center">
          <span class="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-indigo-500/20" />
          <span class="absolute inset-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15" />
          <svg class="relative text-indigo-400" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>

        <!-- Contextual heading -->
        <h2 class="m-0 bg-gradient-to-r from-indigo-300 via-white to-violet-300 bg-clip-text text-xl font-extrabold text-transparent" style="color: var(--text-heading);">
          {{ search || roleFilter !== 'all' || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet' }}
        </h2>

        <!-- Contextual subtext -->
        <p class="mt-2.5 max-w-sm text-sm leading-relaxed" style="color: var(--text-subtle);">
          <template v-if="search">
            No projects match <span class="font-semibold" style="color: var(--text-primary);">"{{ search }}"</span>. Try a different keyword.
          </template>
          <template v-else-if="roleFilter !== 'all' || statusFilter !== 'all'">
            No projects match your current filters. Try changing or clearing your filters.
          </template>
          <template v-else>
            Get started by creating your first project and invite your team to collaborate.
          </template>
        </p>

        <!-- CTA buttons -->
        <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            v-if="search || roleFilter !== 'all' || statusFilter !== 'all'"
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:border-indigo-500/50 hover:text-indigo-400"
            style="background: var(--bg-surface-2); border-color: var(--border-medium); color: var(--text-secondary);"
            @click="search = ''; roleFilter = 'all'; statusFilter = 'all'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Clear filters
          </button>
          <button class="gradient-btn h-10 px-5 text-sm" type="button" @click="goToCreateProject">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>

        <!-- Feature hints row (shown only when truly empty) -->
        <div
          v-if="!search && roleFilter === 'all' && statusFilter === 'all'"
          class="mt-10 grid grid-cols-3 gap-3 text-left sm:gap-5"
        >
          <div
            v-for="hint in emptyStateHints"
            :key="hint.label"
            class="flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center"
            style="background: var(--bg-surface-2); border-color: var(--border-base);"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="hint.iconClass" v-html="hint.icon" />
            <span class="text-[11px] font-semibold leading-snug" style="color: var(--text-subtle);">{{ hint.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="project in filteredProjects"
        :key="project.id"
        class="group rounded-2xl border p-5 transition hover:-translate-y-0.5"
        style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white" :style="{ background: project.color || colorForProject(project.id) }">
              {{ initials(project.name) }}
            </div>
            <div class="min-w-0">
              <h2 class="m-0 truncate text-base font-bold" style="color: var(--text-heading);">{{ project.name }}</h2>
              <div class="mt-1 flex flex-wrap gap-1.5">
                <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold" :class="statusClass(project.status)">
                  {{ formatStatus(project.status) }}
                </span>
                <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold" style="background: var(--bg-surface-2); color: var(--text-muted);">
                  {{ getProjectRole(project) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-1">
            <button class="project-icon-btn" type="button" title="Edit project" :disabled="!canManage(project)" @click="openEdit(project)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <button class="project-icon-btn text-red-500" type="button" :title="canManage(project) ? 'Delete project' : 'Leave project'" @click="confirmProjectAction(project)">
              <svg v-if="canManage(project)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <p class="mt-4 line-clamp-2 min-h-[42px] text-sm leading-relaxed" style="color: var(--text-subtle);">
          {{ project.description || 'No description yet.' }}
        </p>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <div class="rounded-xl p-3" style="background: var(--bg-surface-2);">
            <p class="m-0 text-lg font-bold" style="color: var(--text-heading);">{{ project.taskCount ?? 0 }}</p>
            <p class="m-0 mt-0.5 text-[11px] font-semibold" style="color: var(--text-subtle);">Tasks</p>
          </div>
          <div class="rounded-xl p-3" style="background: var(--bg-surface-2);">
            <p class="m-0 text-lg font-bold" style="color: var(--text-heading);">{{ project.memberCount ?? 0 }}</p>
            <p class="m-0 mt-0.5 text-[11px] font-semibold" style="color: var(--text-subtle);">Members</p>
          </div>
          <div class="rounded-xl p-3" style="background: var(--bg-surface-2);">
            <p class="m-0 truncate text-sm font-bold" style="color: var(--text-heading);">{{ formatDeadline(project) }}</p>
            <p class="m-0 mt-0.5 text-[11px] font-semibold" style="color: var(--text-subtle);">Deadline</p>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-between gap-3">
          <p class="m-0 text-xs" style="color: var(--text-subtle);">Updated {{ formatDate(project.updatedAt || project.createdAt) }}</p>
          <button class="outline-btn h-10 px-4" type="button" style="background: var(--bg-surface-2); border-color: var(--border-medium); color: var(--text-secondary);" @click="openProject(project)">
            Open
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="editingProject" class="modal-overlay" @click.self="closeEdit">
        <form class="modal-panel text-left" style="background: var(--modal-bg); border-color: var(--modal-border);" @submit.prevent="submitEdit">
          <h2 class="m-0 text-lg font-bold" style="color: var(--text-heading);">Edit project</h2>
          <p class="mt-1 text-sm" style="color: var(--text-subtle);">Update project name, status, color and description.</p>

          <div class="mt-5 flex flex-col gap-4">
            <label class="flex flex-col gap-1.5 text-sm font-semibold" style="color: var(--text-primary);">
              Name
              <input v-model.trim="editForm.name" class="project-field" maxlength="180" required>
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-semibold" style="color: var(--text-primary);">
              Description
              <textarea v-model.trim="editForm.description" class="project-field min-h-[96px] resize-y" maxlength="1000" />
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1.5 text-sm font-semibold" style="color: var(--text-primary);">
                Status
                <select v-model="editForm.status" class="project-field">
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label class="flex flex-col gap-1.5 text-sm font-semibold" style="color: var(--text-primary);">
                Color
                <input v-model="editForm.color" class="project-field" type="color">
              </label>
            </div>
          </div>

          <p v-if="actionError" class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{{ actionError }}</p>

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button class="outline-btn justify-center" type="button" :disabled="actionLoading" style="background: var(--bg-surface-2); border-color: var(--border-medium); color: var(--text-secondary);" @click="closeEdit">Cancel</button>
            <button class="gradient-btn" type="submit" :disabled="actionLoading || !editForm.name">{{ actionLoading ? 'Saving...' : 'Save changes' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import {
  useDeleteProjectMutation,
  useLeaveProjectMutation,
  useUpdateProjectMutation,
} from '@/api/projects'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import type { ProjectSummary } from '@/types/project.types'
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

type RoleFilter = 'all' | 'owned' | 'joined'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const { projects, currentProjectId, loadingProjects } = storeToRefs(projectStore)

const search = ref('')
const roleFilter = ref<RoleFilter>('all')
const statusFilter = ref('all')
const editingProject = ref<ProjectSummary | null>(null)
const actionError = ref('')
const actionLoading = ref(false)
const editForm = reactive({
  name: '',
  description: '',
  status: 'ACTIVE',
  color: '#6366f1',
})

const updateProjectMutation = useUpdateProjectMutation()
const deleteProjectMutation = useDeleteProjectMutation()
const leaveProjectMutation = useLeaveProjectMutation()

onMounted(() => {
  void projectStore.initializeAfterAuth(true)
})

const roleFilters: Array<{ label: string; value: RoleFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Owned', value: 'owned' },
  { label: 'Joined', value: 'joined' },
]

const emptyStateHints = [
  {
    label: 'Organize Tasks',
    iconClass: 'bg-indigo-500/10 text-indigo-400',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  },
  {
    label: 'Invite Team',
    iconClass: 'bg-emerald-500/10 text-emerald-400',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    label: 'Track Progress',
    iconClass: 'bg-violet-500/10 text-violet-400',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  },
]

const ownedProjects = computed(() => projects.value.filter((project) => canManage(project)))
const joinedProjects = computed(() => projects.value.filter((project) => !canManage(project)))
const activeProjects = computed(() => projects.value.filter((project) => normalizeStatus(project.status) === 'ACTIVE'))
const totalTasks = computed(() => projects.value.reduce((sum, project) => sum + (project.taskCount ?? 0), 0))

const stats = computed(() => [
  {
    label: 'Total Projects',
    value: projects.value.length,
    caption: `${activeProjects.value.length} active`,
    iconClass: 'bg-indigo-500/10 text-indigo-500',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  },
  {
    label: 'Owned',
    value: ownedProjects.value.length,
    caption: 'Full control',
    iconClass: 'bg-emerald-500/10 text-emerald-500',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z"/></svg>',
  },
  {
    label: 'Joined',
    value: joinedProjects.value.length,
    caption: 'Member access',
    iconClass: 'bg-cyan-500/10 text-cyan-500',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    label: 'All Tasks',
    value: totalTasks.value,
    caption: 'Across projects',
    iconClass: 'bg-amber-500/10 text-amber-500',
    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  },
])

const filteredProjects = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return projects.value.filter((project) => {
    const matchesSearch =
      !keyword ||
      project.name.toLowerCase().includes(keyword) ||
      (project.description ?? '').toLowerCase().includes(keyword)
    const matchesStatus =
      statusFilter.value === 'all' || normalizeStatus(project.status) === statusFilter.value
    const matchesRole =
      roleFilter.value === 'all' ||
      (roleFilter.value === 'owned' && canManage(project)) ||
      (roleFilter.value === 'joined' && !canManage(project))

    return matchesSearch && matchesStatus && matchesRole
  })
})

function normalizeStatus(status?: string) {
  return (status || 'ACTIVE').toUpperCase()
}

function getProjectRole(project: ProjectSummary) {
  if (project.role) return project.role
  if (project.createdBy === authStore.user?.id || project.ownerId === authStore.user?.id) return 'OWNER'
  const memberRole = project.members?.find((member) => member.userId === authStore.user?.id)?.role
  return memberRole || 'MEMBER'
}

function canManage(project: ProjectSummary) {
  const role = getProjectRole(project).toUpperCase()
  return role === 'OWNER' || role === 'ADMIN'
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P'
}

function colorForProject(id: string) {
  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']
  const index = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

function statusClass(status?: string) {
  if (normalizeStatus(status) === 'ARCHIVED') {
    return 'bg-slate-500/10 text-slate-500'
  }
  return 'bg-emerald-500/10 text-emerald-500'
}

function formatStatus(status?: string) {
  return normalizeStatus(status).replace(/_/g, ' ')
}

function formatDate(value?: string | null) {
  if (!value) return 'recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatDeadline(project: ProjectSummary) {
  return project.endDate ? formatDate(project.endDate) : 'No date'
}

function openProject(project: ProjectSummary) {
  projectStore.setCurrentProjectId(project.id, { persist: true })
  void router.push({ name: 'project-board', params: { projectId: project.id } })
}

function goToCreateProject() {
  void router.push({ name: 'create-project' })
}

function openEdit(project: ProjectSummary) {
  if (!canManage(project)) return
  editingProject.value = project
  actionError.value = ''
  editForm.name = project.name
  editForm.description = project.description ?? ''
  editForm.status = normalizeStatus(project.status)
  editForm.color = project.color || colorForProject(project.id)
}

function closeEdit() {
  if (actionLoading.value) return
  editingProject.value = null
  actionError.value = ''
}

async function submitEdit() {
  if (!editingProject.value || !editForm.name) return
  actionLoading.value = true
  actionError.value = ''

  try {
    await updateProjectMutation.mutateAsync({
      projectId: editingProject.value.id,
      payload: {
        name: editForm.name,
        description: editForm.description || undefined,
        status: editForm.status,
        color: editForm.color,
      },
    })
    await projectStore.initializeAfterAuth(true)
    toast.success('Project updated')
    closeEdit()
  } catch (error) {
    actionError.value = extractErrorMessage(error)
  } finally {
    actionLoading.value = false
  }
}

async function confirmProjectAction(project: ProjectSummary) {
  const ownerAction = canManage(project)
  const message = ownerAction
    ? `Delete "${project.name}"? This action cannot be undone.`
    : `Leave "${project.name}"?`

  if (!window.confirm(message)) return

  actionLoading.value = true
  actionError.value = ''

  try {
    if (ownerAction) {
      await deleteProjectMutation.mutateAsync(project.id)
      if (currentProjectId.value === project.id) {
        projectStore.setCurrentProjectId(null, { clearStored: true })
      }
      toast.success('Project deleted')
    } else {
      await leaveProjectMutation.mutateAsync({
        projectId: project.id,
        userId: authStore.user?.id ?? '',
      })
      if (currentProjectId.value === project.id) {
        projectStore.setCurrentProjectId(null, { clearStored: true })
      }
      toast.success('Left project')
    }

    await projectStore.initializeAfterAuth(true)
  } catch (error) {
    toast.error(extractErrorMessage(error))
  } finally {
    actionLoading.value = false
  }
}

function extractErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const payload = (error as { response?: { data?: unknown } }).response?.data
    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message
      if (typeof message === 'string') return message
      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') return nested
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Action failed'
}
</script>

<style scoped>
.project-icon-btn {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  background: var(--bg-surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-icon-btn:hover:not(:disabled) {
  border-color: #a5b4fc;
  color: #6366f1;
  background: var(--bg-active);
}

.project-icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.project-field {
  width: 100%;
  border: 1.5px solid var(--border-medium);
  border-radius: 10px;
  background: var(--bg-surface-2);
  color: var(--text-primary);
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.project-field:focus {
  border-color: #6366f1;
  background: var(--bg-surface);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* ── Empty state animations ── */
@keyframes empty-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

@keyframes empty-float-alt {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(6px); }
}

@keyframes empty-pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.0); }
  50%       { box-shadow: 0 0 24px 4px rgba(99,102,241,0.18); }
}

.empty-icon-ring {
  animation: empty-float 3.6s ease-in-out infinite, empty-pulse-glow 3.6s ease-in-out infinite;
}

.empty-dot { animation: empty-float 4s ease-in-out infinite; }
.empty-dot-1 { animation-duration: 3.8s; animation-delay: 0s; }
.empty-dot-2 { animation: empty-float-alt 4.4s ease-in-out infinite; animation-delay: 0.6s; }
.empty-dot-3 { animation-duration: 5.1s; animation-delay: 1.1s; }
.empty-dot-4 { animation: empty-float-alt 3.6s ease-in-out infinite; animation-delay: 0.3s; }
</style>
