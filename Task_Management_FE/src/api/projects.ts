import { del, get, patch, post } from './client'
import type { CreateProjectPayload, ProjectSummary } from '@/types/project.types'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

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

export function useProjectsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.projects.list(),
    queryFn: () => listUserProjects(),
  })
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
  const response = await post<ProjectSummary | ApiEnvelope<ProjectSummary>>('/projects', payload)
  return unwrapApiPayload(response)
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.list() })
    },
  })
}

export async function listProjectMembers(projectId: string): Promise<unknown[]> {
  const response = await get<unknown[] | ApiEnvelope<unknown[]>>(`/projects/${projectId}/members`)
  const payload = unwrapApiPayload(response)
  return Array.isArray(payload) ? payload : []
}

export async function joinProject(projectId: string, token: string): Promise<unknown> {
  const response = await post(`/projects/${projectId}/join`, { token })
  return unwrapApiPayload(response)
}

export async function createProjectInviteToken(projectId: string): Promise<{ token: string }> {
  const response = await post<{ token: string } | ApiEnvelope<{ token: string }>>(
    `/projects/${projectId}/invite`
  )
  return unwrapApiPayload(response)
}

export function useProjectMembersQuery(projectId: MaybeRef<string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.projects.members(unref(projectId) ?? 'none')),
    enabled: computed(() => !!unref(projectId)),
    queryFn: () => {
      const id = unref(projectId)
      if (!id) return Promise.resolve([])
      return listProjectMembers(id)
    },
  })
}

export async function addProjectMember(projectId: string, userId: string, role = 'DEVELOPER'): Promise<unknown> {
  const response = await post(`/projects/${projectId}/members`, { userId, role })
  return unwrapApiPayload(response)
}

export async function removeProjectMember(projectId: string, userId: string): Promise<unknown> {
  const response = await del(`/projects/${projectId}/members/${userId}`)
  return unwrapApiPayload(response)
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: string
): Promise<unknown> {
  const response = await patch(`/projects/${projectId}/members/${userId}/role`, { role })
  return unwrapApiPayload(response)
}

export function useAddProjectMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role?: string }) =>
      addProjectMember(projectId, userId, role),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.members(projectId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.members(projectId) })
    },
  })
}


