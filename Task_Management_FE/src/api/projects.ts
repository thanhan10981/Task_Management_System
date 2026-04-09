import { get, post } from './client'
import type { CreateProjectPayload, ProjectSummary } from '@/types/project.types'

interface ApiEnvelope<T> {
  data?: T
}

interface PaginatedProjectsPayload {
  data?: ProjectSummary[]
  meta?: unknown
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }

  return response as T
}

function extractProjectsList(payload: unknown): ProjectSummary[] {
  if (Array.isArray(payload)) {
    return payload as ProjectSummary[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const directData = (payload as PaginatedProjectsPayload).data
  if (Array.isArray(directData)) {
    return directData
  }

  const nestedData = (payload as { data?: PaginatedProjectsPayload }).data
  if (nestedData && Array.isArray(nestedData.data)) {
    return nestedData.data
  }

  return []
}

export async function listUserProjects(): Promise<ProjectSummary[]> {
  const response = await get<PaginatedProjectsPayload | ApiEnvelope<PaginatedProjectsPayload>>('/projects', {
    params: {
      page: 1,
      limit: 100,
    },
  })

  return extractProjectsList(response)
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
  const response = await post<ProjectSummary | ApiEnvelope<ProjectSummary>>('/projects', payload)
  return unwrapApiPayload(response)
}
