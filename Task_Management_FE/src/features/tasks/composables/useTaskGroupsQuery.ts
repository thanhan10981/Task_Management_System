import {
  createProjectGroup,
  listProjectGroups,
  type TaskGroup,
} from '@/api/tasks'
import { QUERY_KEYS } from '@/constants/query-keys'
import { queryClient } from '@/lib/query-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRef, unref } from 'vue'

type CreateProjectGroupInput = {
  projectId: string
  name: string
  color: string
}

type UseProjectGroupsQueryOptions = {
  enabled?: MaybeRef<boolean>
}

export function fetchProjectGroupsQuery(projectId: string): Promise<TaskGroup[]> {
  return queryClient.fetchQuery({
    queryKey: QUERY_KEYS.tasks.groups(projectId),
    queryFn: () => listProjectGroups(projectId),
    staleTime: 0,
  })
}

export function useProjectGroupsQuery(
  projectId: MaybeRef<string | null | undefined>,
  options: UseProjectGroupsQueryOptions = {},
) {
  const enabled = computed(() => {
    const explicitEnabled =
      typeof options.enabled === 'undefined' ? true : Boolean(unref(options.enabled))

    return explicitEnabled && Boolean(unref(projectId))
  })

  return useQuery({
    queryKey: computed(() => QUERY_KEYS.tasks.groups(unref(projectId) ?? 'none')),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: () => {
      const pid = unref(projectId)
      if (!pid) return Promise.resolve([])
      return listProjectGroups(pid)
    },
  })
}

export function useCreateProjectGroupMutation() {
  const localQueryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectGroupInput) =>
      createProjectGroup(payload.projectId, {
        name: payload.name,
        color: payload.color,
      }),
    onSuccess: async (_created, payload) => {
      await Promise.all([
        localQueryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.groups(payload.projectId) }),
        localQueryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all }),
      ])
    },
  })
}
