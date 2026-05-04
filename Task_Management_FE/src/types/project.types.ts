export interface ProjectSummary {
  id: string
  name: string
  description?: string | null
  status?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateProjectPayload {
  name: string
  description?: string
  color?: string
  icon?: string
  memberIds?: string[]
}
