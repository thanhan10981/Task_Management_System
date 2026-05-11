import {
  createProjectSprint,
  listProjectSprints,
  type SprintSummary,
} from '@/api/sprints'
import { QUERY_KEYS } from '@/constants/query-keys'
import { queryClient } from '@/lib/query-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRef, unref } from 'vue'

type CreateProjectSprintInput = {
  projectId: string
  name: string
  startDate?: string
  endDate?: string
}

type UseProjectSprintsQueryOptions = {
  enabled?: MaybeRef<boolean>
}

export function fetchProjectSprintsQuery(projectId: string): Promise<SprintSummary[]> {
  return queryClient.fetchQuery({
    queryKey: QUERY_KEYS.sprints.list(projectId),
    queryFn: () => listProjectSprints(projectId),
    staleTime: 0,
  })
}

export function useProjectSprintsQuery(
  projectId: MaybeRef<string | null | undefined>,
  options: UseProjectSprintsQueryOptions = {},
) {
  const enabled = computed(() => {
    const explicitEnabled =
      typeof options.enabled === 'undefined' ? true : Boolean(unref(options.enabled))

    return explicitEnabled && Boolean(unref(projectId))
  })

  return useQuery({
    queryKey: computed(() => QUERY_KEYS.sprints.list(unref(projectId) ?? 'none')),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: () => {
      const pid = unref(projectId)
      if (!pid) return Promise.resolve([])
      return listProjectSprints(pid)
    },
  })
}

export function useCreateProjectSprintMutation() {
  const localQueryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectSprintInput) => createProjectSprint(payload),
    onSuccess: async (_created, payload) => {
      await Promise.all([
        localQueryClient.invalidateQueries({ queryKey: QUERY_KEYS.sprints.list(payload.projectId) }),
        localQueryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all }),
      ])
    },
  })
}
