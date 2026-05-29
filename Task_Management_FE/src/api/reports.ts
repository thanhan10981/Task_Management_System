import { get } from './client'

export type ReportPeriod = 'daily' | 'weekly' | 'monthly'

export interface TaskReportQuery {
  projectId?: string
  sprintId?: string
  period?: ReportPeriod
  month?: string
}

export interface TaskReportData {
  summary: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    completionRate: number
  }
  taskByStatus: Array<{
    label: string
    count: number
    color: string
  }>
  taskByPriority: Array<{
    label: string
    count: number
    color: string
  }>
  sprintProgress: Array<{
    id: string
    name: string
    total: number
    done: number
    remaining: number
  }>
  completionChart: {
    period: ReportPeriod
    labels: string[]
    completedSeries: number[]
  }
  overdueTasks: Array<{
    id: string
    title: string
    assignee: string
    priority: string
    dueDate: string
    status: string
    project: string
  }>
  memberPerformance: Array<{
    id: string
    name: string
    email: string
    role: string
    assigned: number
    completed: number
    overdue: number
    rate: number
  }>
  generatedAt: string
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

export async function getTaskReport(params: TaskReportQuery): Promise<TaskReportData> {
  const response = await get<TaskReportData | ApiEnvelope<TaskReportData>>('/task-analytics/report', {
    params,
  })

  return unwrapApiPayload(response)
}
