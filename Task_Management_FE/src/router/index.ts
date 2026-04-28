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
        path: 'projects/create',
        name: 'create-project',
        component: () => import('@/features/dashboard/views/CreateProjectView.vue'),
        meta: { title: 'Create Project' },
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
        redirect: (to) => ({
          name: 'tasks',
          query: { ...to.query, taskId: String(to.params.id) },
        }),
        meta: { title: 'Task Detail', requiresProject: true },
      },
      {
        path: 'files',
        name: 'files',
        component: () => import('@/features/files/views/FilesView.vue'),
        meta: { title: 'Files', requiresProject: true },
      },
      {
        path: 'board',
        name: 'board',
        component: () => import('@/features/tasks/views/BoardView.vue'),
        meta: { title: 'Board', requiresProject: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/features/settings/views/SettingsView.vue'),
        meta: { title: 'Settings' },
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

    if (to.meta.requiresProject && !projectStore.hasCurrentProject) {
      return { name: 'dashboard', query: to.query, hash: to.hash }
    }
  }
})

export default router
