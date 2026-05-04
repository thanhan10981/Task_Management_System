import { get, post } from './client'
import type { TaskSearchApiResponse, TaskSearchApiTask } from '@/features/tasks/types/task-search.types'

export interface TaskGroup {
  id: string
  name: string
  color: string
  position?: number
  projectId: string
}

interface ApiEnvelope<T> {
  data?: T
}

interface TaskSearchParams {
  projectId: string
  search: string
  page?: number
  limit?: number
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }
  return response as T
}

function extractTaskList(payload: unknown): TaskSearchApiTask[] {
  if (Array.isArray(payload)) {
    return payload as TaskSearchApiTask[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const directData = (payload as TaskSearchApiResponse).data
  if (Array.isArray(directData)) {
    return directData
  }

  const nestedData = (payload as { data?: TaskSearchApiResponse }).data
  if (nestedData && Array.isArray(nestedData.data)) {
    return nestedData.data
  }

  return []
}

export async function listProjectGroups(projectId: string): Promise<TaskGroup[]> {
  try {
    const response = await get<TaskGroup[] | ApiEnvelope<TaskGroup[]>>(
      `/tasks/projects/${projectId}/groups`
    )
    const payload = unwrapApiPayload(response)
    return Array.isArray(payload) ? payload : []
  } catch (error) {
    console.error('Failed to fetch task groups:', error)
    return []
  }
}


export async function createProjectGroup(
  projectId: string,
  data: { name: string; color: string }
): Promise<TaskGroup> {
  const response = await post<TaskGroup | ApiEnvelope<TaskGroup>>(
    `/tasks/projects/${projectId}/groups`,
    data
  )
  return unwrapApiPayload(response)
}

export async function searchTasks(params: TaskSearchParams): Promise<TaskSearchApiTask[]> {
  const response = await get<TaskSearchApiResponse | TaskSearchApiTask[]>('/tasks', {
    params: {
      projectId: params.projectId,
      search: params.search,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  })

  return extractTaskList(response)
}


