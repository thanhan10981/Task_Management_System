import { del, get, patch, post } from '@/api/client'
import type { UpdateTaskInput } from '../schemas/task.schema'

const BASE = '/tasks'

function unwrapTaskPayload<T>(response: T | { data?: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data as T
  }

  return response as T
}

export const taskService = {
  listTasks: (params?: Record<string, unknown>) => get(BASE, { params }),
  listProjectStatuses: async (projectId: string) => {
    const response = await get<unknown[] | { data?: unknown[] }>(`${BASE}/projects/${projectId}/statuses`)
    const payload = unwrapTaskPayload(response)
    return Array.isArray(payload) ? payload : []
  },
  createTask: (data: Record<string, unknown>) => post(BASE, data),
  createProjectStatus: (projectId: string, data: Record<string, unknown>) =>
    post(`${BASE}/projects/${projectId}/statuses`, data),
  updateProjectStatus: (projectId: string, statusId: string, data: Record<string, unknown>) =>
    patch(`${BASE}/projects/${projectId}/statuses/${statusId}`, data),
  updateTask: (id: string, data: UpdateTaskInput) => patch(`${BASE}/${id}`, data),
  deleteTask: (id: string) => del(`${BASE}/${id}`),
  deleteProjectStatus: (projectId: string, statusId: string) =>
    del(`${BASE}/projects/${projectId}/statuses/${statusId}`),
}
