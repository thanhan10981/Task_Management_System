export const QUERY_KEYS = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), params] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.all, 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => [...QUERY_KEYS.projects.all, 'list'] as const,
  },
  files: {
    all: ['files'] as const,
    folders: (projectId: string) => [...QUERY_KEYS.files.all, 'folders', projectId] as const,
    list: (projectId: string, folderPath: string, includeDescendants: boolean) =>
      [...QUERY_KEYS.files.all, 'list', projectId, folderPath, includeDescendants] as const,
    allInProject: (projectId: string) => [...QUERY_KEYS.files.all, 'all', projectId] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    login: ['auth', 'login'] as const,
    register: ['auth', 'register'] as const,
  },
} as const
