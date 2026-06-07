import { del, get, patch } from './client'
import type { User } from '@/types/user.types'

export type AdminUserRole = 'USER' | 'ADMIN'
export type AdminProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
export type AdminTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface AdminPaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminPaginated<T> {
  data: T[]
  meta: AdminPaginationMeta
}

export interface AdminProject {
  id: string
  name: string
  description?: string | null
  status: AdminProjectStatus
  color?: string | null
  icon?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: User
  _count?: {
    members?: number
    tasks?: number
    files?: number
  }
}

export interface AdminTaskStatus {
  id: string
  name: string
  color?: string | null
  isDone?: boolean
}

export interface AdminTask {
  id: string
  projectId: string
  title: string
  description?: string | null
  priority: AdminTaskPriority
  progress?: string | number
  startDate?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  project?: Pick<AdminProject, 'id' | 'name' | 'status'>
  status?: AdminTaskStatus
  statusId: string
  group?: { id: string; name: string; color?: string | null } | null
  sprint?: { id: string; name: string; status: string } | null
  createdByUser?: User
  updatedByUser?: User | null
  assignees?: Array<{ id: string; userId: string; user: User }>
}

export interface AdminMember {
  id: string
  role: string
  joinedAt: string
  user: User
  project: Pick<AdminProject, 'id' | 'name' | 'status' | 'createdAt'> & { creator?: User }
  addedByUser?: User | null
}

export interface AdminStats {
  totals: {
    users: number
    activeUsers: number
    inactiveUsers: number
    projects: number
    tasks: number
  }
  tasksByStatus: Array<AdminTaskStatus & { statusId: string; statusName: string; count: number }>
  recentProjects: AdminProject[]
  recentTasks: AdminTask[]
}

interface ApiEnvelope<T> {
  data?: T
}

function unwrap<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T
  }
  return payload as T
}

function cleanParams<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  )
}

export function getAdminStats() {
  return get<AdminStats | ApiEnvelope<AdminStats>>('/admin/stats').then(unwrap)
}

export function getAdminUsers(params?: { search?: string; page?: number; limit?: number }) {
  return get<AdminPaginated<User>>('/admin/users', { params: cleanParams(params) })
}

export function getAdminUser(id: string) {
  return get<User | ApiEnvelope<User>>(`/admin/users/${id}`).then(unwrap)
}

export function updateAdminUserRole(id: string, role: AdminUserRole) {
  return patch<User | ApiEnvelope<User>>(`/admin/users/${id}/role`, { role }).then(unwrap)
}

export function updateAdminUserStatus(id: string, isActive: boolean) {
  return patch<User | ApiEnvelope<User>>(`/admin/users/${id}/status`, { isActive }).then(unwrap)
}

export function getAdminProjects(params?: {
  search?: string
  status?: AdminProjectStatus | ''
  page?: number
  limit?: number
}) {
  return get<AdminPaginated<AdminProject>>('/admin/projects', { params: cleanParams(params) })
}

export function updateAdminProjectStatus(id: string, status: AdminProjectStatus) {
  return patch<AdminProject | ApiEnvelope<AdminProject>>(`/admin/projects/${id}/status`, { status }).then(unwrap)
}

export function deleteAdminProject(id: string) {
  return del<{ success: boolean } | ApiEnvelope<{ success: boolean }>>(`/admin/projects/${id}`).then(unwrap)
}

export function getAdminTasks(params?: {
  search?: string
  projectId?: string
  statusId?: string
  priority?: AdminTaskPriority | ''
  assigneeId?: string
  page?: number
  limit?: number
}) {
  return get<AdminPaginated<AdminTask>>('/admin/tasks', { params: cleanParams(params) })
}

export function updateAdminTaskStatus(id: string, statusId: string) {
  return patch<AdminTask | ApiEnvelope<AdminTask>>(`/admin/tasks/${id}/status`, { statusId }).then(unwrap)
}

export function deleteAdminTask(id: string) {
  return del<AdminTask | ApiEnvelope<AdminTask>>(`/admin/tasks/${id}`).then(unwrap)
}

export function getAdminMembers(params?: { search?: string; page?: number; limit?: number }) {
  return get<AdminPaginated<AdminMember>>('/admin/members', { params: cleanParams(params) })
}
