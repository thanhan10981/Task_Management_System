export const QUERY_KEYS = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...QUERY_KEYS.tasks.lists(), params] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.all, 'detail', id] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const
