import { get } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { apiResponseSchema, paginatedResponseSchema } from '@/schemas/api-response.schema'
import { useQuery } from '@tanstack/vue-query'
import { taskSchema } from '../schemas/task.schema'

const taskListResponseSchema = paginatedResponseSchema(taskSchema)
const taskDetailResponseSchema = apiResponseSchema(taskSchema)

export const useTasksQuery = (params: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list(params),
    queryFn: async () => {
      const response = await get('/tasks', { params })
      return taskListResponseSchema.parse(response)
    },
  })
}

export const useTaskDetailQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: async () => {
      const response = await get(`/tasks/${id}`)
      return taskDetailResponseSchema.parse(response)
    },
  })
}
