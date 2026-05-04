import { get, post } from './client'

export interface SprintSummary {
  id: string
  projectId: string
  name: string
  goal?: string | null
  description?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  completedAt?: string | null
}

interface ApiEnvelope<T> {
  data?: T
}

interface PaginatedPayload<T> {
  data?: T[]
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }

  return response as T
}

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []

  const directData = (payload as PaginatedPayload<T>).data
  if (Array.isArray(directData)) return directData

  const nestedData = (payload as { data?: PaginatedPayload<T> }).data
  if (nestedData && Array.isArray(nestedData.data)) return nestedData.data

  return []
}

export async function listProjectSprints(projectId: string): Promise<SprintSummary[]> {
  const response = await get<PaginatedPayload<SprintSummary> | ApiEnvelope<PaginatedPayload<SprintSummary>>>(
    '/sprints',
    { params: { projectId, page: 1, limit: 100 } }
  )

  return extractList<SprintSummary>(response)
}

export async function createProjectSprint(payload: {
  projectId: string
  name: string
  startDate?: string
  endDate?: string
}): Promise<SprintSummary> {
  const response = await post<SprintSummary | ApiEnvelope<SprintSummary>>('/sprints', payload)
  return unwrapApiPayload(response)
}
