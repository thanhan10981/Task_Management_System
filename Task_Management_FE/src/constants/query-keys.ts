export const QUERY_KEYS = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), params] as const,
    search: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.all, 'search', params] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.all, 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => [...QUERY_KEYS.projects.all, 'list'] as const,
  },
  taskAnalytics: {
    all: ['task-analytics'] as const,
    chart: (period: 'daily' | 'weekly' | 'monthly', projectId?: string | null, month?: string) =>
      [...QUERY_KEYS.taskAnalytics.all, 'chart', period, projectId ?? 'all', month ?? 'current'] as const,
  },
  files: {
    all: ['files'] as const,
    folders: (projectId: string) => [...QUERY_KEYS.files.all, 'folders', projectId] as const,
    list: (projectId: string, folderPath: string, includeDescendants: boolean) =>
      [...QUERY_KEYS.files.all, 'list', projectId, folderPath, includeDescendants] as const,
    allInProject: (projectId: string) => [...QUERY_KEYS.files.all, 'all', projectId] as const,
    access: (fileId: string, mode: 'preview' | 'download') =>
      [...QUERY_KEYS.files.all, 'access', fileId, mode] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    login: ['auth', 'login'] as const,
    register: ['auth', 'register'] as const,
    forgotPassword: ['auth', 'forgot-password'] as const,
    resetPassword: ['auth', 'reset-password'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...QUERY_KEYS.users.all, 'list'] as const,
    list: (search: string) => [...QUERY_KEYS.users.lists(), search] as const,
    detail: (id: string) => [...QUERY_KEYS.users.all, 'detail', id] as const,
  },
  userSettings: {
    all: ['user-settings'] as const,
    me: () => [...QUERY_KEYS.userSettings.all, 'me'] as const,
  },
} as const
