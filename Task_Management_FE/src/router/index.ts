import { useAuthStore } from '@/stores/auth.store'
import { useProjectStore } from '@/stores/project.store'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

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
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/features/tasks/views/TaskListView.vue'),
        meta: { title: 'Tasks', requiresProject: true },
      },
      {
        path: 'tasks/:id',
        name: 'task-detail',
        component: () => import('@/features/tasks/views/TaskDetailView.vue'),
        meta: { title: 'Task Detail', requiresProject: true },
      },
      {
        path: 'files',
        name: 'files',
        component: () => import('@/features/files/views/FilesView.vue'),
        meta: { title: 'Files', requiresProject: true },
      },
      {
        path: 'timeline',
        name: 'timeline',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
        meta: { title: 'Timeline', requiresProject: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
        meta: { title: 'Settings', requiresProject: true },
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
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (authStore.isAuthenticated) {
    const projectStore = useProjectStore()
    await projectStore.initializeAfterAuth()

    const currentProjectExists = projectStore.currentProjectId
      ? projectStore.projects.some((project) => project.id === projectStore.currentProjectId)
      : false

    if (projectStore.currentProjectId && !currentProjectExists) {
      projectStore.setCurrentProjectId(null)
    }

    if (to.meta.requiresProject && !projectStore.currentProjectId) {
      return { name: 'dashboard', query: to.query, hash: to.hash }
    }
  }
})

export default router
