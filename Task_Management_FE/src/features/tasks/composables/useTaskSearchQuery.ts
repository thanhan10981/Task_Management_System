import { searchTasks } from '@/api/tasks'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRef, computed, unref } from 'vue'
import type {
  TaskSearchApiAssignee,
  TaskSearchApiTask,
  TaskSearchResult,
} from '../types/task-search.types'

interface TaskSearchParams {
  projectId: string
  search: string
  limit: number
}

interface UseTaskSearchOptions {
  enabled?: MaybeRef<boolean>
}

function mapAssignees(rawAssignees?: TaskSearchApiAssignee[] | null) {
  if (!Array.isArray(rawAssignees)) return []

  return rawAssignees
    .map((assignee) => {
      const user = assignee.user
      if (!user?.id) return null

      return {
        id: user.id,
        name: user.fullName?.trim() || user.email?.trim() || 'User',
        email: user.email ?? null,
        avatarUrl: user.avatarUrl ?? null,
      }
    })
    .filter((assignee): assignee is TaskSearchResult['assignees'][number] => Boolean(assignee))
}

function mapSearchTask(task: TaskSearchApiTask): TaskSearchResult | null {
  if (!task.id) return null

  return {
    taskId: task.id,
    title: task.title?.trim() || 'Untitled task',
    status: task.status?.name?.trim() || 'Unknown',
    priority: task.priority?.trim() || 'MEDIUM',
    dueDate: task.dueDate ?? null,
    assignees: mapAssignees(task.assignees),
    projectId: task.projectId ?? '',
  }
}

export const useTaskSearchQuery = (
  params: MaybeRef<TaskSearchParams | null>,
  options: UseTaskSearchOptions = {}
) => {
  const normalizedParams = computed(() => {
    const raw = unref(params)
    if (!raw) return null

    return {
      projectId: raw.projectId,
      search: raw.search.trim(),
      limit: raw.limit,
    }
  })

  const enabled = computed(() => {
    if (typeof options.enabled === 'undefined') {
      return Boolean(normalizedParams.value?.search)
    }

    return Boolean(unref(options.enabled))
  })

  return useQuery({
    queryKey: computed(() =>
      QUERY_KEYS.tasks.search({
        projectId: normalizedParams.value?.projectId,
        search: normalizedParams.value?.search,
        limit: normalizedParams.value?.limit,
      })
    ),
    enabled,
    queryFn: async () => {
      const paramsValue = normalizedParams.value
      if (!paramsValue) return []

      const tasks = await searchTasks({
        projectId: paramsValue.projectId,
        search: paramsValue.search,
        limit: paramsValue.limit,
      })
      return tasks
        .map(mapSearchTask)
        .filter((task): task is TaskSearchResult => Boolean(task))
    },
  })
}
