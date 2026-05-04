<template>
  <div class="flex min-h-screen" style="background: var(--bg-app); font-family: 'Inter', system-ui, sans-serif;">

    <!-- ══ SIDEBAR — hidden on mobile, visible md+ ════════════════════════ -->
    <aside
      class="hidden md:flex w-20 min-h-screen h-screen sticky top-0 z-50 flex-col items-center pt-4 pb-6 flex-shrink-0"
      style="background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); box-shadow: 2px 0 12px rgba(0,0,0,0.03);"
    >
      <!-- Logo -->
      <div class="flex items-center justify-center py-1">
        <OctomLogo size="sm" orientation="col" />
      </div>

      <!-- Divider -->
      <div class="w-8 h-px my-2.5" style="background: var(--border-base);" />

      <!-- Nav -->
      <nav class="flex flex-col items-center gap-1 flex-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="navTarget(item)"
          class="nav-item relative w-11 h-11 rounded-[14px] flex items-center justify-center cursor-pointer no-underline font-[inherit] border-none bg-transparent transition-all duration-[180ms]"
          :class="isActive(item) ? 'nav-item--active' : ''"
          :title="item.label"
          active-class=""
        >
          <span class="nav-icon flex items-center justify-center" v-html="item.icon" />
          <span class="nav-tooltip">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- ══ RIGHT COLUMN ═══════════════════════════════════════ -->
    <div class="flex flex-col flex-1 min-w-0">

      <!-- ── TOP HEADER ─────────────────────────────────────── -->
      <header
        class="h-12 md:h-16 flex items-center px-3 md:px-7 gap-2 md:gap-5 sticky top-0 z-40"
        style="background: var(--header-bg); border-bottom: 1px solid var(--header-border); box-shadow: var(--shadow-sm);"
      >
        <!-- Mobile: logo -->
        <div class="flex md:hidden items-center mr-1 shrink-0">
          <OctomLogo size="sm" :showText="false" orientation="row" />
        </div>

        <!-- Search -->
        <div class="flex-1 max-w-[420px] mx-auto relative flex items-center">
          <svg
            class="absolute left-3 md:left-3.5 pointer-events-none flex-shrink-0 text-slate-400"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            class="search-input w-full h-[34px] md:h-[38px] rounded-xl pl-9 md:pl-10 pr-3 text-[13px] outline-none font-[inherit] transition-all duration-200"
            style="border: 1.5px solid var(--search-border); background: var(--search-bg); color: var(--text-secondary);"
            type="text"
            placeholder="Search..."
            @keyup.enter="handleSearch"
          >
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">

          <!-- Project selector -->
          <div ref="projectMenuWrapRef" class="relative">
            <button
              class="h-8 md:h-10 inline-flex items-center gap-1 md:gap-2 rounded-xl px-2 md:px-3 text-[11px] md:text-[13px] font-semibold cursor-pointer max-w-[110px] md:max-w-[220px] transition-all duration-200"
              style="border: 1.5px solid var(--btn-border); background: var(--btn-bg); color: var(--text-secondary);"
              @click.stop="toggleProjectMenu"
            >
              <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ currentProjectName }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="flex-shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <Transition name="dropdown-fade">
              <div
                v-if="projectMenuOpen"
                class="absolute top-[calc(100%+8px)] right-0 min-w-[240px] max-w-[300px] rounded-2xl border p-2 z-[300]"
                style="background: var(--dropdown-bg); border-color: var(--border-base); box-shadow: var(--shadow-lg);"
                @click.stop
              >
                <button
                  v-for="project in projects"
                  :key="project.id"
                  class="w-full flex items-center gap-2 rounded-[10px] border-none text-[13px] font-semibold cursor-pointer px-2.5 py-2 text-left transition-colors duration-150"
                  :class="project.id === currentProjectId
                    ? 'text-indigo-700'
                    : ''"
                  :style="project.id === currentProjectId
                    ? 'background: var(--bg-active);'
                    : 'background: none; color: var(--text-secondary);'"
                  @click="selectProject(project.id)"
                >
                  <span class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ project.name }}</span>
                </button>

                <div class="h-px my-1" style="background: var(--divider);" />
                <button
                  class="w-full border-none rounded-[10px] bg-none text-indigo-500 text-[13px] font-bold cursor-pointer text-left px-2.5 py-2 hover:opacity-80 transition-opacity"
                  style="background: none;"
                  @click="goToCreateProject"
                >
                  + Create Project
                </button>
              </div>
            </Transition>
          </div>

          <!-- Notification bell -->
          <button
            class="notif-btn relative w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center cursor-pointer text-indigo-500 flex-shrink-0 transition-all duration-200"
            style="border: 1.5px solid var(--btn-border); background: var(--btn-bg);"
            title="Notifications"
            @click="toggleNotif"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span
              v-if="unreadCount > 0"
              class="notif-badge absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-[9px] bg-red-500 border-2 border-white text-white text-[10px] font-extrabold leading-[14px] flex items-center justify-center tracking-tight"
              style="box-shadow: 0 2px 6px rgba(239,68,68,0.4);"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Avatar + dropdown -->
          <div
            ref="avatarWrapRef"
            class="flex items-center gap-1.5 cursor-pointer relative px-2 py-1 rounded-xl transition-all duration-200"
            style="border: 1.5px solid var(--btn-border); background: var(--btn-bg);"
            @click="toggleUserMenu"
          >
            <div
              class="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-extrabold text-white tracking-wide flex-shrink-0"
            >
              {{ userInitial }}
            </div>
            <svg class="flex-shrink-0 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>

            <!-- User dropdown -->
            <Transition name="dropdown-fade">
              <div
                v-if="userMenuOpen"
                class="absolute top-[calc(100%+8px)] right-0 rounded-2xl border p-2 min-w-[220px] z-[300]"
                style="background: var(--dropdown-bg); border-color: var(--border-base); box-shadow: var(--shadow-lg);"
                @click.stop
              >
                <div class="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0">
                    {{ userInitial }}
                  </div>
                  <div>
                    <p class="text-[13px] font-bold capitalize m-0" style="color: var(--text-heading);">{{ displayUserName }}</p>
                    <p class="text-[11px] mt-0.5 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap m-0" style="color: var(--text-subtle);">{{ authStore.user?.email ?? '' }}</p>
                  </div>
                </div>
                <div class="h-px my-1" style="background: var(--divider);" />
                <button
                  class="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] border-none bg-none text-[13px] font-semibold text-red-500 cursor-pointer font-[inherit] transition-colors duration-150 hover:bg-red-50"
                  style="background: none;"
                  @click="handleLogout"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- ── PAGE CONTENT ─────────────────────────────────────── -->
      <main
        class="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0"
        :class="isBoardRoute ? 'p-0' : 'p-4 md:p-6 md:px-7 md:pb-8'"
      >
        <RouterView />
      </main>
    </div>

    <!-- ══ BOTTOM NAV — mobile only ═══════════════════════════════════════ -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around
                h-14 border-t"
         style="background:var(--sidebar-bg); border-color:var(--sidebar-border); box-shadow:0 -2px 12px rgba(0,0,0,0.08);">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="navTarget(item)"
        class="bottom-nav-item flex flex-col items-center justify-center gap-0.5 flex-1 h-full
               text-[10px] font-semibold cursor-pointer no-underline transition-all duration-150"
        :class="isActive(item) ? 'bottom-nav-item--active' : ''"
        active-class=""
      >
        <span class="nav-icon flex items-center justify-center" v-html="item.icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- ══ CREATE PROJECT MODAL ═══════════════════════════════ -->
    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div
          v-if="createProjectModalOpen"
          class="fixed inset-0 flex items-center justify-center z-[500] p-5"
          style="background: rgba(15,23,42,0.45);"
          @click="closeCreateProjectModal"
        >
          <div
            class="w-full max-w-[520px] rounded-2xl border p-5"
            style="background: var(--modal-bg); border-color: var(--modal-border); box-shadow: var(--shadow-xl);"
            @click.stop
          >
            <h3 class="text-xl font-bold m-0" style="color: var(--text-heading);">Create Project</h3>
            <p class="mt-1.5 mb-4 text-[13px] m-0" style="color: var(--text-muted);">Create a new project and switch to it instantly.</p>

            <form class="flex flex-col gap-2" @submit.prevent="submitCreateProject">
              <label class="text-xs font-semibold" style="color: var(--text-secondary);" for="create-project-name">Project name</label>
              <input
                id="create-project-name"
                v-model.trim="createProjectForm.name"
                type="text"
                class="field-input w-full rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit] transition-all duration-[180ms]"
                style="border: 1px solid var(--border-strong); background: var(--input-bg); color: var(--text-primary);"
                maxlength="180"
                required
                autofocus
              >

              <label class="text-xs font-semibold" style="color: var(--text-secondary);" for="create-project-description">Description</label>
              <textarea
                id="create-project-description"
                v-model.trim="createProjectForm.description"
                class="field-input w-full rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit] transition-all duration-[180ms] resize-y min-h-[80px]"
                style="border: 1px solid var(--border-strong); background: var(--input-bg); color: var(--text-primary);"
                maxlength="1000"
                rows="3"
              />

              <label class="text-xs font-semibold" style="color: var(--text-secondary);" for="create-project-members">Add members</label>
              <div ref="memberPickerRef" class="relative">
                <div v-if="selectedMembers.length" class="flex flex-wrap gap-1.5 mb-2">
                  <button
                    v-for="member in selectedMembers"
                    :key="member.id"
                    type="button"
                    class="inline-flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 rounded-full px-2.5 py-1 text-xs text-indigo-900 cursor-pointer"
                    @click="removeMember(member.id)"
                  >
                    <span class="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{{ displayMemberName(member) }}</span>
                    <span class="text-[13px] leading-none">&times;</span>
                  </button>
                </div>

                <input
                  id="create-project-members"
                  v-model.trim="memberSearchQuery"
                  type="text"
                  class="field-input w-full rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit] transition-all duration-[180ms]"
                  style="border: 1px solid var(--border-strong); background: var(--input-bg); color: var(--text-primary);"
                  placeholder="Search user by name or email"
                  @focus="memberDropdownOpen = true"
                >

                <div
                  v-if="memberDropdownOpen"
                  class="mt-1.5 rounded-[10px] border max-h-[190px] overflow-y-auto"
                  style="border-color: var(--border-medium); background: var(--dropdown-bg); box-shadow: var(--shadow-md);"
                >
                  <p v-if="loadingAssignableUsers" class="m-0 p-2.5 text-xs" style="color: var(--text-muted);">Loading members...</p>
                  <p v-else-if="memberLoadError" class="m-0 p-2.5 text-xs text-red-600">{{ memberLoadError }}</p>
                  <p v-else-if="filteredAssignableUsers.length === 0" class="m-0 p-2.5 text-xs" style="color: var(--text-muted);">No members found</p>

                  <button
                    v-for="user in filteredAssignableUsers"
                    :key="user.id"
                    type="button"
                    class="w-full border-none text-left px-2.5 py-2 flex flex-col gap-0.5 cursor-pointer transition-colors duration-150"
                    style="background: var(--dropdown-bg);"
                    @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--dropdown-item-hover)'"
                    @mouseleave="($event.currentTarget as HTMLElement).style.background = 'var(--dropdown-bg)'"
                    @click="addMember(user)"
                  >
                    <span class="text-[13px] font-semibold" style="color: var(--text-heading);">{{ displayMemberName(user) }}</span>
                    <span class="text-xs" style="color: var(--text-muted);">{{ user.email }}</span>
                  </button>
                </div>
              </div>

              <p v-if="createProjectError" class="text-red-600 text-[13px] mt-1 m-0">{{ createProjectError }}</p>

              <div class="mt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  class="border-none rounded-[10px] text-[13px] font-semibold px-3.5 py-2.5 cursor-pointer transition-colors duration-[180ms]"
                  style="background: var(--bg-surface-3); color: var(--text-secondary);"
                  @click="closeCreateProjectModal"
                >Cancel</button>
                <button
                  type="submit"
                  class="border-none rounded-[10px] text-[13px] font-semibold px-3.5 py-2.5 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-[180ms] disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="creatingProject || !createProjectForm.name"
                >
                  {{ creatingProject ? 'Creating...' : 'Create Project' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import { storeToRefs } from 'pinia'
import OctomLogo from '@/components/common/OctomLogo.vue'
import { useAuthMeQuery } from '@/features/auth/composables/useAuthQueries'
import { useUsersQuery } from '@/features/users/composables/useUsersQuery'
import type { User } from '@/types/user.types'

const router = useRouter()
const route  = useRoute()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const { projects, currentProjectId } = storeToRefs(projectStore)

/* ── Search ─────────────────────────────────────────── */
const searchQuery = ref('')
function handleSearch() {
  // wire to global search later
}

/* ── Notifications ──────────────────────────────────── */
const unreadCount = ref(2)
function toggleNotif() { /* open notif panel */ }

/* ── Menus ──────────────────────────────────────────── */
const userMenuOpen      = ref(false)
const avatarWrapRef     = ref<HTMLElement | null>(null)
const projectMenuOpen   = ref(false)
const projectMenuWrapRef= ref<HTMLElement | null>(null)
const createProjectModalOpen = ref(false)
const creatingProject   = ref(false)
const createProjectError= ref('')
const memberSearchQuery = ref('')
const memberDropdownOpen= ref(false)
const memberPickerRef   = ref<HTMLElement | null>(null)
const selectedMembers   = ref<User[]>([])
const createProjectForm = reactive({ name: '', description: '' })

const selectedMemberIds = computed(() => new Set(selectedMembers.value.map((m) => m.id)))
const shouldHydrateCurrentUser = computed(() => Boolean(authStore.accessToken) && !authStore.user)
const authMeQuery = useAuthMeQuery(shouldHydrateCurrentUser)
const assignableUsersQuery = useUsersQuery(memberSearchQuery, {
  enabled: computed(() => createProjectModalOpen.value),
})
const assignableUsers        = computed(() => assignableUsersQuery.data.value ?? [])
const loadingAssignableUsers = computed(() => assignableUsersQuery.isPending.value)
const memberLoadError        = computed(() => (assignableUsersQuery.isError.value ? 'Failed to load users' : ''))

const filteredAssignableUsers = computed(() => {
  const query = memberSearchQuery.value.trim().toLowerCase()
  return assignableUsers.value
    .filter((u) => u.id !== authStore.user?.id)
    .filter((u) => !selectedMemberIds.value.has(u.id))
    .filter((u) => {
      if (!query) return true
      return (u.fullName || '').toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    })
    .slice(0, 8)
})

const currentProjectName = computed(() => {
  const current = projects.value.find((p) => p.id === currentProjectId.value)
  return current?.name ?? 'Select Project'
})

const isBoardRoute = computed(() => route.name === 'board')

function toggleUserMenu(e: MouseEvent) {
  e.stopPropagation()
  userMenuOpen.value = !userMenuOpen.value
}

function toggleProjectMenu() {
  projectMenuOpen.value = !projectMenuOpen.value
}

function onClickOutside(e: MouseEvent) {
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(e.target as Node))
    userMenuOpen.value = false
  if (projectMenuWrapRef.value && !projectMenuWrapRef.value.contains(e.target as Node))
    projectMenuOpen.value = false
  if (memberPickerRef.value && !memberPickerRef.value.contains(e.target as Node))
    memberDropdownOpen.value = false
}

watch(
  () => authMeQuery.data.value?.data,
  (user) => { if (user) authStore.setAuth(authStore.accessToken, user) },
  { immediate: true },
)
watch(
  () => authMeQuery.error.value,
  (error) => { if (error) console.error('[DefaultLayout] Cannot hydrate current user', error) },
)

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

/* ── Auth ──────────────────────────────────────────── */
const userInitial = computed(() => {
  const fullName = authStore.user?.fullName?.trim() ?? ''
  if (fullName) {
    return fullName.split(/\s+/).map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase()
  }
  const email = authStore.user?.email ?? ''
  return email.charAt(0).toUpperCase() || 'U'
})

const displayUserName = computed(() =>
  authStore.user?.fullName?.trim() || authStore.user?.email?.split('@')[0] || 'User'
)

function handleLogout() {
  userMenuOpen.value = false
  projectMenuOpen.value = false
  authStore.logout()
  router.push({ name: 'login' })
}

function selectProject(projectId: string) {
  projectMenuOpen.value = false
  projectStore.setCurrentProjectId(projectId)
  const routeName  = typeof route.name === 'string' ? route.name : 'dashboard'
  const targetName = routeName === 'not-found' ? 'dashboard' : routeName
  void router.push({ name: targetName, query: route.query, hash: route.hash })
}

function goToCreateProject() {
  projectMenuOpen.value = false
  createProjectError.value = ''
  createProjectModalOpen.value = true
  memberDropdownOpen.value = false
}

function closeCreateProjectModal() {
  createProjectModalOpen.value = false
  createProjectError.value = ''
  createProjectForm.name = ''
  createProjectForm.description = ''
  memberSearchQuery.value = ''
  memberDropdownOpen.value = false
  selectedMembers.value = []
}

function displayMemberName(user: User) {
  return user.fullName?.trim() || user.email
}

function addMember(user: User) {
  if (selectedMemberIds.value.has(user.id)) return
  selectedMembers.value.push(user)
  memberSearchQuery.value = ''
  memberDropdownOpen.value = true
}

function removeMember(userId: string) {
  selectedMembers.value = selectedMembers.value.filter((m) => m.id !== userId)
}

async function submitCreateProject() {
  if (!createProjectForm.name) return
  creatingProject.value = true
  createProjectError.value = ''
  try {
    const created = await projectStore.createAndSelectProject({
      name: createProjectForm.name,
      description: createProjectForm.description || undefined,
      memberIds: selectedMembers.value.map((m) => m.id),
    })
    if (created?.id) {
      closeCreateProjectModal()
      if (route.name !== 'dashboard') await router.push({ name: 'dashboard' })
    }
  } catch (error) {
    createProjectError.value = extractErrorMessage(error)
  } finally {
    creatingProject.value = false
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
  return 'Failed to create project'
}

function isActive(item: { routeName: string }) {
  const routeName = typeof route.name === 'string' ? route.name : ''
  if (item.routeName === 'tasks') return routeName === 'tasks' || routeName === 'task-detail'
  return routeName === item.routeName
}

function navTarget(item: { routeName: string; requiresProject?: boolean }) {
  if (!item.requiresProject) return { name: item.routeName }
  if (!currentProjectId.value) return { name: 'dashboard' }
  return { name: item.routeName }
}

const navItems = [
  {
    name: 'dashboard', label: 'Dashboard', routeName: 'dashboard', requiresProject: false,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>`,
  },
  {
    name: 'board', label: 'Board', routeName: 'board', requiresProject: true,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>`,
  },
  {
    name: 'tasks', label: 'Tasks', routeName: 'tasks', requiresProject: true,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
    </svg>`,
  },
  {
    name: 'settings', label: 'Settings', routeName: 'settings', requiresProject: true,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
  },
  {
    name: 'files', label: 'Files', routeName: 'files', requiresProject: true,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>`,
  },
]
</script>

<style scoped>
/* 1. Nav item: CSS-variable colors + hover + active gradient */
.nav-item { color: var(--text-subtle); }
.nav-item:hover {
  background: var(--nav-hover-bg);
  color: var(--nav-hover-color);
  transform: translateY(-1px);
}
.nav-item--active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}

/* 2. :deep() for injected SVG */
.nav-icon :deep(svg) { display: block; }

/* 3. Tooltip — needs ::before arrow pseudo-element */
.nav-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  background: #1e293b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-50%) translateX(-4px);
  transition: opacity 0.18s, transform 0.18s;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
}
.nav-tooltip::before {
  content: '';
  position: absolute;
  right: 100%; top: 50%;
  transform: translateY(-50%);
  border: 5px solid transparent;
  border-right-color: #1e293b;
}
.nav-item:hover .nav-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* 4. Search focus with CSS-variable background */
.search-input::placeholder { color: var(--text-subtle); }
.search-input:focus {
  border-color: #6366f1 !important;
  background: var(--search-focus-bg) !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* 5. Field input focus */
.field-input:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

/* 6. @keyframes — not possible in Tailwind */
.notif-badge { animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes badge-pop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* 7. Dropdown transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-fade-enter-from,
.dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* 8. Hover states using CSS variables (can't be done with Tailwind) */
.notif-btn:hover {
  border-color: #a5b4fc !important;
  background: var(--bg-active) !important;
  transform: translateY(-1px);
}

/* 9. Bottom nav — mobile only */
.bottom-nav-item { color: var(--text-subtle); }
.bottom-nav-item :deep(svg) { width: 20px; height: 20px; }
.bottom-nav-item--active {
  color: #6366f1;
}
.bottom-nav-item--active :deep(svg) {
  stroke: #6366f1;
}
</style>
