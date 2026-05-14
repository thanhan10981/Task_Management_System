import { get, patch } from './client'

export interface NotificationItem {
  id: string
  userId: string
  projectId?: string | null
  type: string
  title?: string | null
  content?: string | null
  data?: unknown
  isRead: boolean
  readAt?: string | null
  createdAt: string
}

interface ApiEnvelope<T> {
  data?: T
}

interface PaginatedNotificationsPayload {
  data?: NotificationItem[]
  meta?: unknown
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }

  return response as T
}

function extractNotifications(payload: unknown): NotificationItem[] {
  if (Array.isArray(payload)) {
    return payload as NotificationItem[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const directData = (payload as PaginatedNotificationsPayload).data
  if (Array.isArray(directData)) {
    return directData
  }

  const nestedData = (payload as { data?: PaginatedNotificationsPayload }).data
  if (nestedData && Array.isArray(nestedData.data)) {
    return nestedData.data
  }

  return []
}

export async function listNotifications(params?: { page?: number; limit?: number; type?: string }) {
  const response = await get<PaginatedNotificationsPayload | ApiEnvelope<PaginatedNotificationsPayload>>(
    '/notifications',
    { params }
  )

  return extractNotifications(unwrapApiPayload(response))
}

export async function markNotificationRead(id: string) {
  return patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  return patch('/notifications/read-all')
}
