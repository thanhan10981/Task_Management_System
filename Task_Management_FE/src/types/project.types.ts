export interface ProjectSummary {
  id: string
  name: string
  description?: string | null
  status?: string
  createdBy?: string
  ownerId?: string
  createdAt?: string
  updatedAt?: string
  startDate?: string | null
  endDate?: string | null
  // Extended fields (may be returned by backend)
  memberCount?: number
  taskCount?: number
  role?: string // Current user's role in this project
  color?: string
  members?: Array<{
    userId: string
    role?: string
  }>
  _count?: {
    tasks?: number
    members?: number
  }
}

export interface CreateProjectPayload {
  name: string
  description?: string
  color?: string
  icon?: string
  memberIds?: string[]
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  color?: string
  status?: string
}
