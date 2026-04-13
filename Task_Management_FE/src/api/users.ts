import { get } from './client'
import type { User } from '@/types/user.types'

interface ApiEnvelope<T> {
  data?: T
}

interface PaginatedUsersPayload {
  data?: User[]
  meta?: unknown
}

function extractUsersList(payload: unknown): User[] {
  if (Array.isArray(payload)) {
    return payload as User[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const directData = (payload as PaginatedUsersPayload).data
  if (Array.isArray(directData)) {
    return directData
  }

  const nestedData = (payload as { data?: PaginatedUsersPayload }).data
  if (nestedData && Array.isArray(nestedData.data)) {
    return nestedData.data
  }

  return []
}

export async function listUsers(search?: string): Promise<User[]> {
  const response = await get<PaginatedUsersPayload | ApiEnvelope<PaginatedUsersPayload>>('/users', {
    params: {
      page: 1,
      limit: 100,
      search: search || undefined,
    },
  })

  return extractUsersList(response)
}
