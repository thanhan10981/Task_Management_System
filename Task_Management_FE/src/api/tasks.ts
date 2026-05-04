import { get, post } from './client'

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

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }
  return response as T
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


