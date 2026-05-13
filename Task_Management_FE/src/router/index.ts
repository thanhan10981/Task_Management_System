import { get } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import type { User } from '@/types/user.types'
import type { LocationQueryRaw, RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const LAST_PROJECT_STORAGE_KEY = 'lastProjectId'
const LEGACY_PROJECT_STORAGE_KEY = 'current_project_id'

function getStoredProjectId() {
  return (
    localStorage.getItem(LAST_PROJECT_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_PROJECT_STORAGE_KEY)
  )
}

function resolveLegacyProjectRoute(name: string, to: { query?: LocationQueryRaw; hash?: string } = {}) {
  const projectId = getStoredProjectId()
  if (!projectId) {
    return { name: 'create-project' }
  }

  return {
    name,
    params: { projectId },
    query: to.query,
    hash: to.hash,
  }
}

async function restoreAuthFromCookie(authStore: ReturnType<typeof useAuthStore>) {
  try {
    const raw = await get<{ data: User } | User>('/auth/me')
    // Backend may return raw User or { data: User }
    const user: User | undefined =
      raw && typeof raw === 'object' && 'data' in raw && typeof (raw as { data: User }).data?.id === 'string'
        ? (raw as { data: User }).data
        : (raw as User)?.id ? (raw as User) : undefined

    if (!user?.id) return false

    authStore.setAuth(null, user)
    return true
  } catch {
    return false
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'dashboard' },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'projects',
        name: 'projects-list',
        component: () => import('@/features/projects/views/ProjectsView.vue'),
        meta: { title: 'My Projects' },
      },
      {
        path: 'projects/create',
        name: 'create-project',
        component: () => import('@/features/dashboard/views/CreateProjectView.vue'),
        meta: { title: 'Create Project' },
      },
      {
        path: 'projects/:projectId/tasks',
        name: 'project-tasks',
        component: () => import('@/features/tasks/views/TaskListView.vue'),
        meta: { title: 'Tasks', requiresProject: true },
      },
      {
        path: 'projects/:projectId/tasks/:id',
        name: 'project-task-detail',
        redirect: (to) => ({
          name: 'project-tasks',
          params: { projectId: to.params.projectId },
          query: { ...to.query, taskId: String(to.params.id) },
        }),
        meta: { title: 'Task Detail', requiresProject: true },
      },
      {
        path: 'projects/:projectId/files',
        name: 'project-files',
        component: () => import('@/features/files/views/FilesView.vue'),
        meta: { title: 'Files', requiresProject: true },
      },
      {
        path: 'projects/:projectId/board',
        name: 'project-board',
        component: () => import('@/features/tasks/views/BoardView.vue'),
        meta: { title: 'Board', requiresProject: true },
      },
      {
        path: 'projects/:projectId/join',
        name: 'project-join',
        component: () => import('@/features/dashboard/views/JoinProjectView.vue'),
        meta: { title: 'Join Project' },
      },
      {
        path: 'projects/:projectId/settings',
        name: 'project-settings',
        component: () => import('@/features/settings/views/SettingsView.vue'),
        meta: { title: 'Settings', requiresProject: true },
      },
      {
        path: 'tasks',
        name: 'tasks-legacy',
        redirect: (to) => resolveLegacyProjectRoute('project-tasks', to),
      },
      {
        path: 'tasks/:id',
        name: 'task-detail-legacy',
        redirect: (to) => {
          const projectId = getStoredProjectId()
          if (!projectId) {
            return { name: 'create-project' }
          }

          return {
            name: 'project-tasks',
            params: { projectId },
            query: { ...to.query, taskId: String(to.params.id) },
          }
        },
      },
      {
        path: 'board',
        name: 'board-legacy',
        redirect: (to) => resolveLegacyProjectRoute('project-board', to),
      },
      {
        path: 'settings',
        name: 'settings-legacy',
        redirect: (to) => resolveLegacyProjectRoute('project-settings', to),
      },
      {
        path: 'files',
        name: 'files-legacy',
        redirect: (to) => resolveLegacyProjectRoute('project-files', to),
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', guestOnly: true },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', guestOnly: true },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
        meta: { title: 'Forgot Password', guestOnly: true },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/features/auth/views/ResetPasswordView.vue'),
        meta: { title: 'Reset Password', guestOnly: true },
      },
    ],
  },
  {
    path: '/files/open/:id',
    name: 'file-open',
    component: () => import('@/features/files/views/FileOpenRedirectView.vue'),
    meta: { title: 'Opening File', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/features/errors/views/NotFoundView.vue'),
    meta: { title: '404 Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const pageTitle = to.meta.title as string | undefined
  document.title = pageTitle ? `${pageTitle} | OCTOM` : 'OCTOM'

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const restored = await restoreAuthFromCookie(authStore)
    if (restored) {
      return
    }

    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (authStore.isAuthenticated) {
    const projectStore = useProjectStore()
    await projectStore.initializeAfterAuth()

    const projectId = typeof to.params.projectId === 'string' ? to.params.projectId : null

    if (projectId) {
      projectStore.setCurrentProjectId(projectId)

      if (projectStore.hasCurrentProject) {
        projectStore.setCurrentProjectId(projectId, { persist: true })
      } else {
        projectStore.setCurrentProjectId(null, { clearStored: true })
      }
    } else {
      if (!projectStore.currentProjectId) {
        const storedId = projectStore.getStoredLastProjectId()
        if (storedId) {
          projectStore.setCurrentProjectId(storedId)
        }
      }
    }

    if (to.meta.requiresProject && (!projectId || !projectStore.hasCurrentProject)) {
      if (!projectStore.hasProjects) {
        return { name: 'create-project', query: to.query, hash: to.hash }
      }

      return { name: 'dashboard', query: to.query, hash: to.hash }
    }
  }
})

export default router
