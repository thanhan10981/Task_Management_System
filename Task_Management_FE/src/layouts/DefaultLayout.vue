<template>
  <div class="app-shell">

    <!-- ══ SIDEBAR ══════════════════════════════════════════════ -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <OctomLogo size="sm" orientation="col" text-color="text-slate-800" />
      </div>

      <div class="sidebar-divider" />
      <!-- Nav -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="navTarget(item)"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item) }"
          :title="item.label"
          active-class=""
        >
          <span class="nav-icon" v-html="item.icon" />
          <span class="nav-tooltip">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- ══ RIGHT COLUMN (header + content) ═══════════════════════ -->
    <div class="right-col">

      <!-- ── TOP HEADER ─────────────────────────────────────────── -->
      <header class="top-header">
        <!-- Search (centre) -->
        <div class="header-search">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Search anything..."
            @keyup.enter="handleSearch"
          >
        </div>

        <!-- Right actions -->
        <div class="header-actions">
          <div ref="projectMenuWrapRef" class="project-menu-wrap">
            <button class="project-menu-btn" @click.stop="toggleProjectMenu">
              <span class="project-menu-label">{{ currentProjectName }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <Transition name="dropdown-fade">
              <div v-if="projectMenuOpen" class="project-dropdown" @click.stop>
                <button
                  v-for="project in projects"
                  :key="project.id"
                  class="project-dropdown-item"
                  :class="project.id === currentProjectId ? 'project-dropdown-item--active' : ''"
                  @click="selectProject(project.id)"
                >
                  <span class="project-dot" />
                  <span class="project-dropdown-name">{{ project.name }}</span>
                </button>

                <div class="dropdown-divider" />
                <button class="project-create-btn" @click="goToCreateProject">
                  + Create Project
                </button>
              </div>
            </Transition>
          </div>

          <!-- Notification bell -->
          <button class="notif-btn" title="Notifications" @click="toggleNotif">
            <!-- Bell body -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <!-- Badge with count -->
            <span v-if="unreadCount > 0" class="notif-badge">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Avatar + dropdown -->
          <div ref="avatarWrapRef" class="avatar-wrap" @click="toggleUserMenu">
            <div class="header-avatar">{{ userInitial }}</div>
            <svg class="avatar-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>

            <!-- Dropdown -->
            <Transition name="dropdown-fade">
              <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
                <div class="dropdown-header">
                  <div class="dropdown-avatar">{{ userInitial }}</div>
                  <div>
                    <p class="dropdown-name">{{ authStore.user?.email?.split('@')[0] ?? 'User' }}</p>
                    <p class="dropdown-email">{{ authStore.user?.email ?? '' }}</p>
                  </div>
                </div>
                <div class="dropdown-divider" />
                <button class="dropdown-item" @click="handleLogout">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- ── PAGE CONTENT ─────────────────────────────────────── -->
      <main class="main-content">
        <RouterView />
      </main>
    </div>

    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div v-if="createProjectModalOpen" class="modal-overlay" @click="closeCreateProjectModal">
          <div class="project-modal" @click.stop>
            <h3 class="project-modal-title">Create Project</h3>
            <p class="project-modal-subtitle">Create a new project and switch to it instantly.</p>

            <form class="project-modal-form" @submit.prevent="submitCreateProject">
              <label class="project-field-label" for="create-project-name">Project name</label>
              <input
                id="create-project-name"
                v-model.trim="createProjectForm.name"
                type="text"
                class="project-field-input"
                maxlength="180"
                required
                autofocus
              >

              <label class="project-field-label" for="create-project-description">Description</label>
              <textarea
                id="create-project-description"
                v-model.trim="createProjectForm.description"
                class="project-field-input project-field-textarea"
                maxlength="1000"
                rows="3"
              />

              <label class="project-field-label" for="create-project-members">Add members</label>
              <div ref="memberPickerRef" class="member-picker">
                <div v-if="selectedMembers.length" class="member-chip-list">
                  <button
                    v-for="member in selectedMembers"
                    :key="member.id"
                    type="button"
                    class="member-chip"
                    @click="removeMember(member.id)"
                  >
                    <span class="member-chip-name">{{ displayMemberName(member) }}</span>
                    <span class="member-chip-remove">&times;</span>
                  </button>
                </div>

                <input
                  id="create-project-members"
                  v-model.trim="memberSearchQuery"
                  type="text"
                  class="project-field-input"
                  placeholder="Search user by name or email"
                  @focus="memberDropdownOpen = true"
                >

                <div v-if="memberDropdownOpen" class="member-dropdown">
                  <p v-if="loadingAssignableUsers" class="member-dropdown-state">Loading members...</p>
                  <p v-else-if="memberLoadError" class="member-dropdown-state member-dropdown-state--error">
                    {{ memberLoadError }}
                  </p>
                  <p v-else-if="filteredAssignableUsers.length === 0" class="member-dropdown-state">
                    No members found
                  </p>

                  <button
                    v-for="user in filteredAssignableUsers"
                    :key="user.id"
                    type="button"
                    class="member-dropdown-item"
                    @click="addMember(user)"
                  >
                    <span class="member-option-name">{{ displayMemberName(user) }}</span>
                    <span class="member-option-email">{{ user.email }}</span>
                  </button>
                </div>
              </div>

              <p v-if="createProjectError" class="project-error">{{ createProjectError }}</p>

              <div class="project-modal-actions">
                <button type="button" class="project-cancel-btn" @click="closeCreateProjectModal">Cancel</button>
                <button
                  type="submit"
                  class="project-submit-btn"
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import { storeToRefs } from 'pinia'
import OctomLogo from '@/components/common/OctomLogo.vue'
import { listUsers } from '@/api/users'
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
const userMenuOpen = ref(false)
const avatarWrapRef = ref<HTMLElement | null>(null)
const projectMenuOpen = ref(false)
const projectMenuWrapRef = ref<HTMLElement | null>(null)
const createProjectModalOpen = ref(false)
const creatingProject = ref(false)
const createProjectError = ref('')
const assignableUsers = ref<User[]>([])
const loadingAssignableUsers = ref(false)
const memberLoadError = ref('')
const memberSearchQuery = ref('')
const memberDropdownOpen = ref(false)
const memberPickerRef = ref<HTMLElement | null>(null)
const selectedMembers = ref<User[]>([])
const createProjectForm = reactive({
  name: '',
  description: '',
})

const selectedMemberIds = computed(() => new Set(selectedMembers.value.map((member) => member.id)))
const filteredAssignableUsers = computed(() => {
  const query = memberSearchQuery.value.trim().toLowerCase()

  return assignableUsers.value
    .filter((user) => user.id !== authStore.user?.id)
    .filter((user) => !selectedMemberIds.value.has(user.id))
    .filter((user) => {
      if (!query) {
        return true
      }

      const fullName = (user.fullName || '').toLowerCase()
      const email = user.email.toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
    .slice(0, 8)
})

const currentProjectName = computed(() => {
  const current = projects.value.find((project) => project.id === currentProjectId.value)
  return current?.name ?? 'Select Project'
})

function toggleUserMenu(e: MouseEvent) {
  e.stopPropagation()
  userMenuOpen.value = !userMenuOpen.value
}

function toggleProjectMenu() {
  projectMenuOpen.value = !projectMenuOpen.value
}

function onClickOutside(e: MouseEvent) {
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }

  if (projectMenuWrapRef.value && !projectMenuWrapRef.value.contains(e.target as Node)) {
    projectMenuOpen.value = false
  }

  if (memberPickerRef.value && !memberPickerRef.value.contains(e.target as Node)) {
    memberDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

/* ── Auth ──────────────────────────────────────────── */
const userInitial = computed(() => {
  const email = authStore.user?.email ?? ''
  return email.charAt(0).toUpperCase() || 'U'
})

function handleLogout() {
  userMenuOpen.value = false
  projectMenuOpen.value = false
  authStore.logout()
  router.push({ name: 'login' })
}

function selectProject(projectId: string) {
  projectMenuOpen.value = false
  projectStore.setCurrentProjectId(projectId)

  const routeName = typeof route.name === 'string' ? route.name : 'dashboard'
  const targetName = routeName === 'not-found' ? 'dashboard' : routeName

  void router.push({
    name: targetName,
    query: route.query,
    hash: route.hash,
  })
}

function goToCreateProject() {
  projectMenuOpen.value = false
  createProjectError.value = ''
  createProjectModalOpen.value = true
  memberDropdownOpen.value = false
  void ensureAssignableUsersLoaded()
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
  if (selectedMemberIds.value.has(user.id)) {
    return
  }

  selectedMembers.value.push(user)
  memberSearchQuery.value = ''
  memberDropdownOpen.value = true
}

function removeMember(userId: string) {
  selectedMembers.value = selectedMembers.value.filter((member) => member.id !== userId)
}

async function ensureAssignableUsersLoaded() {
  if (assignableUsers.value.length > 0 || loadingAssignableUsers.value) {
    return
  }

  loadingAssignableUsers.value = true
  memberLoadError.value = ''

  try {
    assignableUsers.value = await listUsers()
  } catch {
    memberLoadError.value = 'Failed to load users'
  } finally {
    loadingAssignableUsers.value = false
  }
}

async function submitCreateProject() {
  if (!createProjectForm.name) return

  creatingProject.value = true
  createProjectError.value = ''
  try {
    const created = await projectStore.createAndSelectProject({
      name: createProjectForm.name,
      description: createProjectForm.description || undefined,
      memberIds: selectedMembers.value.map((member) => member.id),
    })

    if (created?.id) {
      closeCreateProjectModal()
      if (route.name !== 'dashboard') {
        await router.push({ name: 'dashboard' })
      }
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
      if (typeof message === 'string') {
        return message
      }

      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') {
        return nested
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to create project'
}

/* ── Active route ──────────────────────────────────── */
function isActive(item: { routeName: string }) {
  const routeName = typeof route.name === 'string' ? route.name : ''

  if (item.routeName === 'tasks') {
    return routeName === 'tasks' || routeName === 'task-detail'
  }

  return routeName === item.routeName
}

function navTarget(item: { routeName: string; requiresProject?: boolean }) {
  if (!item.requiresProject) {
    return { name: item.routeName }
  }

  if (!currentProjectId.value) {
    return { name: 'dashboard' }
  }

  return { name: item.routeName }
}

/* ── Nav items ─────────────────────────────────────── */
const navItems = [
  {
    name: 'dashboard', label: 'Dashboard', routeName: 'dashboard', requiresProject: false,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>`,
  },
  {
    name: 'timeline', label: 'Timeline', routeName: 'timeline', requiresProject: true,
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
/* ─── Reset & fonts ───────────────────────────────────────────── */
* { box-sizing: border-box; }

/* ─── App shell ───────────────────────────────────────────────── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f3f4f8;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════════════════════ */
.sidebar {
  width: 80px;
  min-height: 100vh;
  background: #ffffff;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 24px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 50;
  box-shadow: 2px 0 12px rgba(0,0,0,0.03);
}

/* ─── Sidebar logo ────────────────────────────────────────────── */
.sidebar-logo {
  padding: 4px 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Divider */
.sidebar-divider {
  width: 32px;
  height: 1px;
  background: #f1f5f9;
  margin: 10px 0;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-item {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.15s, box-shadow 0.18s;
  color: #94a3b8;
  border: none;
  background: transparent;
  text-decoration: none;
  font-family: inherit;
}
.nav-item:hover {
  background: #f0f0ff;
  color: #6366f1;
  transform: translateY(-1px);
}
.nav-item--active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon :deep(svg) { display: block; }

/* Tooltip */
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

/* ══════════════════════════════════════════════════════════════
   RIGHT COLUMN
════════════════════════════════════════════════════════════════ */
.right-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── TOP HEADER ────────────────────────────────────────────────── */
.top-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}

/* Brand */
.header-brand {
  flex-shrink: 0;
  min-width: 80px;
}
.header-logo-text {
  font-size: 18px;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: -0.03em;
}

/* Search */
.header-search {
  flex: 1;
  max-width: 420px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
  flex-shrink: 0;
}
.search-input {
  width: 100%;
  height: 38px;
  border-radius: 12px;
  border: 1.5px solid #e8edf5;
  background: #f8fafc;
  padding: 0 14px 0 40px;
  font-size: 13px;
  color: #334155;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input::placeholder { color: #94a3b8; }
.search-input:focus {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* Right actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.project-menu-wrap {
  position: relative;
}

.project-menu-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1.5px solid #e8edf5;
  background: #fff;
  color: #334155;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  max-width: 220px;
  transition: border-color 0.2s, background 0.2s;
}

.project-menu-btn:hover {
  border-color: #c7d2fe;
  background: #f5f5ff;
}

.project-menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 170px;
}

.project-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  max-width: 300px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  padding: 8px;
  z-index: 300;
}

.project-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  border: none;
  border-radius: 10px;
  background: none;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 9px 10px;
  text-align: left;
}

.project-dropdown-item:hover {
  background: #f8fafc;
}

.project-dropdown-item--active {
  background: #eef2ff;
  color: #4338ca;
}

.project-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #6366f1;
  flex-shrink: 0;
}

.project-dropdown-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-create-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  background: none;
  color: #6366f1;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  padding: 9px 10px;
}

.project-create-btn:hover {
  background: #eef2ff;
}

/* ── Notification bell ────────────────────────────────── */
.notif-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1.5px solid #e8edf5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6366f1;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.notif-btn:hover {
  border-color: #a5b4fc;
  background: #eef2ff;
  transform: translateY(-1px);
}
.notif-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ef4444;
  border: 2px solid #fff;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badge-pop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* Avatar */
.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  position: relative;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1.5px solid #e8edf5;
  background: #fff;
  transition: border-color 0.2s, background 0.2s;
}
.avatar-wrap:hover {
  border-color: #c7d2fe;
  background: #f5f5ff;
}
.header-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}
.avatar-caret { color: #94a3b8; flex-shrink: 0; }

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  padding: 8px;
  min-width: 220px;
  z-index: 300;
}
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 10px;
}
.dropdown-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}
.dropdown-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  text-transform: capitalize;
}
.dropdown-email {
  font-size: 11px;
  color: #94a3b8;
  margin: 2px 0 0;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.dropdown-item:hover { background: #fff1f2; }

/* Dropdown transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-fade-enter-from,
.dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── MAIN CONTENT ──────────────────────────────────────────────── */
.main-content {
  flex: 1;
  padding: 28px 32px;
  overflow: auto;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.project-modal {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.24);
  padding: 20px;
}

.project-modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.project-modal-subtitle {
  margin: 6px 0 16px;
  font-size: 13px;
  color: #64748b;
}

.project-modal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-field-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.project-field-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.project-field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.project-field-textarea {
  resize: vertical;
  min-height: 80px;
}

.member-picker {
  position: relative;
}

.member-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.member-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #3730a3;
  cursor: pointer;
}

.member-chip-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-chip-remove {
  font-size: 13px;
  line-height: 1;
}

.member-dropdown {
  margin-top: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  max-height: 190px;
  overflow-y: auto;
}

.member-dropdown-item {
  width: 100%;
  border: none;
  background: #ffffff;
  text-align: left;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.member-dropdown-item:hover {
  background: #f8fafc;
}

.member-option-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.member-option-email {
  font-size: 12px;
  color: #64748b;
}

.member-dropdown-state {
  margin: 0;
  padding: 10px;
  font-size: 12px;
  color: #64748b;
}

.member-dropdown-state--error {
  color: #dc2626;
}

.project-error {
  color: #dc2626;
  font-size: 13px;
  margin: 4px 0 0;
}

.project-modal-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.project-cancel-btn,
.project-submit-btn {
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.18s;
}

.project-cancel-btn {
  background: #f1f5f9;
  color: #334155;
}

.project-cancel-btn:hover {
  background: #e2e8f0;
}

.project-submit-btn {
  background: #6366f1;
  color: #ffffff;
}

.project-submit-btn:hover {
  background: #4f46e5;
}

.project-submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
