export const QUERY_KEYS = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), params] as const,
    search: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.all, 'search', params] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.all, 'detail', id] as const,
    statuses: (projectId: string) => [...QUERY_KEYS.tasks.all, 'statuses', projectId] as const,
    members: (projectId: string) => [...QUERY_KEYS.tasks.all, 'members', projectId] as const,
    trash: (projectId: string) => [...QUERY_KEYS.tasks.all, 'trash', projectId] as const,
    groups: (projectId: string) => [...QUERY_KEYS.tasks.all, 'groups', projectId] as const,
    subtasks: (taskId: string) => [...QUERY_KEYS.tasks.all, 'subtasks', taskId] as const,
    comments: (taskId: string) => [...QUERY_KEYS.tasks.all, 'comments', taskId] as const,
    history: (taskId: string) => [...QUERY_KEYS.tasks.all, 'history', taskId] as const,
    files: (taskId: string) => [...QUERY_KEYS.tasks.all, 'files', taskId] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => [...QUERY_KEYS.projects.all, 'list'] as const,
    members: (projectId: string) => [...QUERY_KEYS.projects.all, 'members', projectId] as const,
  },
  sprints: {
    all: ['sprints'] as const,
    list: (projectId: string) => [...QUERY_KEYS.sprints.all, 'list', projectId] as const,
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
  notifications: {
    all: ['notifications'] as const,
    list: (params: Record<string, unknown>) => [...QUERY_KEYS.notifications.all, 'list', params] as const,
  },
  reminders: {
    all: ['reminders'] as const,
    sendTask: (taskId: string) => [...QUERY_KEYS.reminders.all, 'tasks', taskId, 'send'] as const,
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
