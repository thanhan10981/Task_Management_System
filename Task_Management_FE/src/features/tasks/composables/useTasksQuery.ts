import { get } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { apiResponseSchema, paginatedResponseSchema } from '@/schemas/api-response.schema'
import { useQuery } from '@tanstack/vue-query'
import { type MaybeRef, computed, unref } from 'vue'
import { z } from 'zod'
import { type TaskPriority, type TaskStatus, taskSchema } from '../schemas/task.schema'

type TaskQueryParams = Record<string, unknown>

interface UseTasksQueryOptions {
  enabled?: MaybeRef<boolean>
}

const rawTaskSchema = z
  .object({
    id: z.string().uuid(),
    parentTaskId: z.string().uuid().nullable().optional(),
    title: z.string(),
    description: z.string().nullable().optional(),
    status: z.union([
      z.string(),
      z.object({
        name: z.string(),
      }),
    ]),
    priority: z.string(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const taskListResponseSchema = paginatedResponseSchema(rawTaskSchema)
const taskDetailResponseSchema = apiResponseSchema(rawTaskSchema)

function normalizeStatus(status: unknown): TaskStatus {
  const raw =
    typeof status === 'string'
      ? status
      : typeof status === 'object' && status !== null && 'name' in status
        ? String(status.name)
        : ''

  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (normalized.includes('progress')) {
    return 'in_progress'
  }

  if (normalized.includes('done') || normalized.includes('complete')) {
    return 'done'
  }

  if (normalized.includes('cancel')) {
    return 'cancelled'
  }

  return 'todo'
}

function normalizePriority(priority: string): TaskPriority {
  const normalized = priority.trim().toLowerCase()

  switch (normalized) {
    case 'low':
    case 'medium':
    case 'high':
    case 'urgent':
      return normalized
    default:
      return 'medium'
  }
}

function normalizeTask(rawTask: z.infer<typeof rawTaskSchema>) {
  return taskSchema.parse({
    id: rawTask.id,
    parentTaskId: rawTask.parentTaskId ?? null,
    title: rawTask.title,
    description: rawTask.description ?? undefined,
    status: normalizeStatus(rawTask.status),
    priority: normalizePriority(rawTask.priority),
    dueDate: rawTask.dueDate ?? null,
    assigneeId: rawTask.assigneeId ?? null,
    createdAt: rawTask.createdAt,
    updatedAt: rawTask.updatedAt,
  })
}

export const useTasksQuery = (
  params: MaybeRef<TaskQueryParams> = {},
  options: UseTasksQueryOptions = {}
) => {
  const enabled = computed(() => {
    if (typeof options.enabled === 'undefined') {
      return true
    }

    return Boolean(unref(options.enabled))
  })

  return useQuery({
    queryKey: computed(() => QUERY_KEYS.tasks.list(unref(params))),
    enabled,
    queryFn: async () => {
      const response = await get('/tasks', { params: unref(params) })
      const parsed = taskListResponseSchema.parse(response)

      return {
        ...parsed,
        data: parsed.data.map(normalizeTask).filter((task) => !task.parentTaskId),
      }
    },
  })
}

export const useTaskDetailQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: async () => {
      const response = await get(`/tasks/${id}`)
      const parsed = taskDetailResponseSchema.parse(response)
      return {
        ...parsed,
        data: normalizeTask(parsed.data),
      }
    },
  })
}
