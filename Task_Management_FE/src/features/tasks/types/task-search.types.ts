export interface TaskSearchAssignee {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
}

export interface TaskSearchResult {
  taskId: string
  title: string
  status: string
  priority: string
  dueDate?: string | null
  assignees: TaskSearchAssignee[]
  projectId: string
}

export interface TaskSearchApiUser {
  id?: string
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export interface TaskSearchApiAssignee {
  userId?: string
  user?: TaskSearchApiUser | null
}

export interface TaskSearchApiStatus {
  name?: string | null
}

export interface TaskSearchApiTask {
  id?: string
  title?: string | null
  priority?: string | null
  dueDate?: string | null
  projectId?: string | null
  status?: TaskSearchApiStatus | null
  assignees?: TaskSearchApiAssignee[] | null
}

export interface TaskSearchApiResponse {
  data?: TaskSearchApiTask[]
  meta?: unknown
}
