import { addProjectMember, listProjectMembers } from '@/api/projects'
import { taskService } from '@/features/tasks/services/task.service'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
}

export interface Column {
  id: string
  title: string
  icon: string
  color: string
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  assigneeId?: string
  dueDate?: string
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  text: string
  createdAt: string
}

export interface Attachment {
  id: string
  taskId: string
  name: string
  url: string
  type: 'image' | 'file'
  size: string
}

export interface ActivityLog {
  id: string
  taskId: string
  authorId: string
  action: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  label: string
  labelBg: string
  labelColor: string
  due: string
  sprint: string
  assignees: Member[]
  comments: number
  files: number
  createdAt: string
  updatedAt: string
}

type RawUser = {
  id?: string
  fullName?: string | null
  email?: string | null
}

type RawTaskAssignee = {
  userId?: string
  user?: RawUser | null
}

type RawTaskStatus = {
  id?: string
  name?: string | null
}

type RawTask = {
  id?: string
  title?: string | null
  description?: string | null
  priority?: string | null
  dueDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  status?: RawTaskStatus | null
  assignees?: RawTaskAssignee[] | null
}

type RawProjectStatus = {
  id?: string
  name?: string | null
  color?: string | null
  isDone?: boolean | null
}

type RawProjectMember = {
  userId?: string
  user?: RawUser | null
}

type CreateProjectTaskPayload = {
  projectId: string
  title: string
  description?: string
  statusId: string
  priority: Task['priority']
  dueDate?: string
  assigneeIds?: string[]
}

type CreateProjectStatusPayload = {
  projectId: string
  title: string
  color: string
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: 'list', color: '#94a3b8' },
  { id: 'todo', title: 'To Do', icon: 'check', color: '#6366f1' },
  { id: 'in_progress', title: 'In Progress', icon: 'clock', color: '#f59e0b' },
  { id: 'review', title: 'Review', icon: 'eye', color: '#8b5cf6' },
  { id: 'done', title: 'Done', icon: 'target', color: '#10b981' },
]

const MEMBER_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f97316']

export const useTaskStore = defineStore('tasks', () => {
  const members = ref<Member[]>([])
  const columns = ref<Column[]>([...DEFAULT_COLUMNS])
  const sprints = ref([
    { id: 'sprint1', title: 'Sprint 1 - Apr 2026' },
    { id: 'sprint2', title: 'Sprint 2 - May 2026' },
    { id: 'sprint3', title: 'Sprint 3 - Jun 2026' },
  ])
  const tasks = ref<Task[]>([])
  const subtasks = ref<Subtask[]>([])
  const comments = ref<Comment[]>([])
  const activityLogs = ref<ActivityLog[]>([])
  const attachments = ref<Attachment[]>([])
  const loading = ref(false)
  const loadedProjectId = ref<string | null>(null)

  const labelPresets: Record<string, { bg: string; color: string }> = {
    Design: { bg: '#dbeafe', color: '#2563eb' },
    Research: { bg: '#d1fae5', color: '#059669' },
    Planning: { bg: '#fef9c3', color: '#b45309' },
    Dev: { bg: '#ede9fe', color: '#7c3aed' },
    QA: { bg: '#fee2e2', color: '#dc2626' },
    DevOps: { bg: '#d1fae5', color: '#059669' },
    Content: { bg: '#fce7f3', color: '#be185d' },
    UX: { bg: '#e0f2fe', color: '#0369a1' },
  }

  function labelStyle(label: string) {
    return labelPresets[label] ?? { bg: '#f1f5f9', color: '#475569' }
  }

  function initialsFromName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  function colorFromSeed(seed: string) {
    const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return MEMBER_COLORS[hash % MEMBER_COLORS.length]
  }

  function inferColumnIcon(name: string, isDone = false) {
    const normalized = name.trim().toLowerCase()
    if (isDone || normalized.includes('done') || normalized.includes('complete')) return 'target'
    if (normalized.includes('progress') || normalized.includes('doing')) return 'clock'
    if (normalized.includes('review') || normalized.includes('test')) return 'eye'
    if (normalized.includes('backlog') || normalized.includes('todo')) return 'list'
    return 'check'
  }

  function normalizePriority(priority?: string | null): Task['priority'] {
    const normalized = priority?.trim().toLowerCase()
    if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'urgent') {
      return normalized
    }
    return 'medium'
  }

  function getDisplayName(user?: RawUser | null) {
    return user?.fullName?.trim() || user?.email?.trim() || 'User'
  }

  function mapMember(rawAssignee: RawTaskAssignee): Member | null {
    const id = rawAssignee.userId || rawAssignee.user?.id
    if (!id) return null

    const name = getDisplayName(rawAssignee.user)
    return {
      id,
      name,
      initials: initialsFromName(name),
      color: colorFromSeed(id || name),
    }
  }

  function mapTask(rawTask: RawTask): Task {
    const rawAssignees = Array.isArray(rawTask.assignees) ? rawTask.assignees : []
    const assignees = rawAssignees.map(mapMember).filter((member): member is Member => Boolean(member))
    const emptyLabelStyle = labelStyle('')

    return {
      id: rawTask.id ?? '',
      title: rawTask.title ?? '',
      description: rawTask.description ?? '',
      status: rawTask.status?.id ?? '',
      priority: normalizePriority(rawTask.priority),
      label: '',
      labelBg: emptyLabelStyle.bg,
      labelColor: emptyLabelStyle.color,
      due: rawTask.dueDate ?? '',
      sprint: '',
      assignees,
      comments: 0,
      files: 0,
      createdAt: rawTask.createdAt ?? new Date().toISOString(),
      updatedAt: rawTask.updatedAt ?? new Date().toISOString(),
    }
  }

  function mapProjectMember(rawMember: RawProjectMember): Member | null {
    const id = rawMember.userId || rawMember.user?.id
    if (!id) return null

    const name = getDisplayName(rawMember.user)
    return {
      id,
      name,
      initials: initialsFromName(name),
      color: colorFromSeed(id || name),
    }
  }

  function replaceBoardData(nextColumns: Column[], nextTasks: Task[], nextMembers?: Member[]) {
    columns.value = nextColumns.length ? nextColumns : [...DEFAULT_COLUMNS]
    tasks.value = nextTasks
    members.value = nextMembers
      ? nextMembers
      : Array.from(
          new Map(
            nextTasks.flatMap((task) => task.assignees).map((member) => [member.id, member] as const),
          ).values(),
        )
  }

  function tasksByCol(colId: string) {
    return tasks.value.filter((task) => task.status === colId)
  }

  function subtasksByTask(taskId: string) {
    return subtasks.value.filter((subtask) => subtask.taskId === taskId)
  }

  function subtaskProgress(taskId: string) {
    const all = subtasksByTask(taskId)
    const done = all.filter((subtask) => subtask.completed).length
    return { done, total: all.length }
  }

  function commentsByTask(taskId: string) {
    return comments.value.filter((comment) => comment.taskId === taskId)
  }

  function activityByTask(taskId: string) {
    return activityLogs.value.filter((activity) => activity.taskId === taskId)
  }

  function attachmentsByTask(taskId: string) {
    return attachments.value.filter((attachment) => attachment.taskId === taskId)
  }

  function getMember(id: string) {
    return members.value.find((member) => member.id === id)
  }

  function getTask(id: string) {
    return tasks.value.find((task) => task.id === id)
  }

  async function loadProjectBoard(projectId: string) {
    loading.value = true

    try {
      const [taskResponse, statusResponse, membersResponse] = await Promise.all([
        taskService.listTasks({ projectId, page: 1, limit: 100 }),
        taskService.listProjectStatuses(projectId),
        listProjectMembers(projectId),
      ])

      const nextColumns = Array.isArray(statusResponse)
        ? statusResponse.map((status: RawProjectStatus) => ({
            id: status.id ?? '',
            title: status.name ?? 'Untitled',
            icon: inferColumnIcon(status.name ?? '', Boolean(status.isDone)),
            color: status.color?.trim() || '#94a3b8',
          }))
        : []

      const nextTasks = Array.isArray((taskResponse as { data?: unknown[] })?.data)
        ? ((taskResponse as { data: RawTask[] }).data.map(mapTask))
        : []
      const nextMembers = Array.isArray(membersResponse)
        ? membersResponse
            .map((member) => mapProjectMember(member as RawProjectMember))
            .filter((member): member is Member => Boolean(member))
        : []

      replaceBoardData(nextColumns, nextTasks, nextMembers)
      loadedProjectId.value = projectId
    } finally {
      loading.value = false
    }
  }

  async function addMemberToProject(projectId: string, userId: string) {
    await addProjectMember(projectId, userId)
    await loadProjectBoard(projectId)
  }

  function resetProjectBoard() {
    replaceBoardData([...DEFAULT_COLUMNS], [])
    loadedProjectId.value = null
  }

  async function createTaskInProject(payload: CreateProjectTaskPayload) {
    const priority = payload.priority.toUpperCase()
    const dueDate = payload.dueDate
      ? new Date(`${payload.dueDate}T00:00:00`).toISOString()
      : undefined

    await taskService.createTask({
      title: payload.title,
      description: payload.description || undefined,
      projectId: payload.projectId,
      statusId: payload.statusId,
      priority,
      dueDate,
      assigneeIds: payload.assigneeIds?.length ? payload.assigneeIds : undefined,
    })

    await loadProjectBoard(payload.projectId)
  }

  async function createStatusInProject(payload: CreateProjectStatusPayload) {
    await taskService.createProjectStatus(payload.projectId, {
      name: payload.title,
      color: payload.color,
      position: columns.value.length + 1,
      isDone: false,
      isDefault: columns.value.length === 0,
    })

    await loadProjectBoard(payload.projectId)
  }

  async function updateStatusPosition(projectId: string, statusId: string, position: number) {
    await taskService.updateProjectStatus(projectId, statusId, { position })
    await loadProjectBoard(projectId)
  }

  async function moveTaskToStatus(projectId: string, taskId: string, statusId: string) {
    const task = getTask(taskId)
    if (!task || task.status === statusId) return

    const previousStatus = task.status
    moveTask(taskId, statusId)

    try {
      await taskService.updateTask(taskId, { statusId })
    } catch (error) {
      moveTask(taskId, previousStatus)
      throw error
    }

    if (loadedProjectId.value === projectId) {
      await loadProjectBoard(projectId)
    }
  }

  function addTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'files'>) {
    const lc = labelStyle(data.label)
    tasks.value.push({
      ...data,
      id: `task_${Date.now()}`,
      labelBg: lc.bg,
      labelColor: lc.color,
      comments: 0,
      files: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  function updateTask(id: string, patch: Partial<Task>) {
    const idx = tasks.value.findIndex((task) => task.id === id)
    if (idx < 0) return

    if (patch.label && !patch.labelBg) {
      const lc = labelStyle(patch.label)
      patch.labelBg = lc.bg
      patch.labelColor = lc.color
    }

    tasks.value[idx] = { ...tasks.value[idx], ...patch, updatedAt: new Date().toISOString() }
  }

  function moveTask(taskId: string, newStatus: string, authorId = 'system') {
    const task = getTask(taskId)
    if (!task) return

    const oldStatus = task.status
    updateTask(taskId, { status: newStatus })
    const col = columns.value.find((column) => column.id === newStatus)
    activityLogs.value.push({
      id: `al_${Date.now()}`,
      taskId,
      authorId,
      action: `moved task from ${oldStatus} to ${col?.title ?? newStatus}`,
      createdAt: new Date().toISOString(),
    })
  }

  function addColumn(data: Omit<Column, 'id'>) {
    columns.value.push({ ...data, id: data.title.toLowerCase().replace(/\s+/g, '_') })
  }

  function reorderColumns(newOrder: Column[]) {
    columns.value = newOrder
  }

  function addSubtask(taskId: string, title: string) {
    subtasks.value.push({
      id: `st_${Date.now()}`,
      taskId,
      title,
      completed: false,
    })
  }

  function updateSubtask(id: string, patch: Partial<Subtask>) {
    const idx = subtasks.value.findIndex((subtask) => subtask.id === id)
    if (idx < 0) return
    subtasks.value[idx] = { ...subtasks.value[idx], ...patch }
  }

  function toggleSubtask(id: string) {
    const subtask = subtasks.value.find((item) => item.id === id)
    if (!subtask) return
    subtask.completed = !subtask.completed
  }

  function deleteSubtask(id: string) {
    subtasks.value = subtasks.value.filter((subtask) => subtask.id !== id)
  }

  function addComment(taskId: string, text: string, authorId = 'system') {
    comments.value.push({
      id: `cmt_${Date.now()}`,
      taskId,
      authorId,
      text,
      createdAt: new Date().toISOString(),
    })
    updateTask(taskId, { comments: commentsByTask(taskId).length + 1 })
    activityLogs.value.push({
      id: `al_${Date.now()}`,
      taskId,
      authorId,
      action: 'added a comment',
      createdAt: new Date().toISOString(),
    })
  }

  function addAttachment(taskId: string, att: Omit<Attachment, 'id' | 'taskId'>) {
    attachments.value.push({ ...att, id: `att_${Date.now()}`, taskId })
    updateTask(taskId, { files: attachmentsByTask(taskId).length + 1 })
  }

  function removeAttachment(id: string) {
    const attachment = attachments.value.find((item) => item.id === id)
    if (!attachment) return
    attachments.value = attachments.value.filter((item) => item.id !== id)
    updateTask(attachment.taskId, { files: attachmentsByTask(attachment.taskId).length - 1 })
  }

  return {
    members,
    columns,
    sprints,
    tasks,
    subtasks,
    comments,
    activityLogs,
    attachments,
    loading,
    loadedProjectId,
    tasksByCol,
    subtasksByTask,
    subtaskProgress,
    commentsByTask,
    activityByTask,
    attachmentsByTask,
    getMember,
    getTask,
    labelStyle,
    labelPresets,
    loadProjectBoard,
    resetProjectBoard,
    addMemberToProject,
    createTaskInProject,
    createStatusInProject,
    updateStatusPosition,
    moveTaskToStatus,
    addTask,
    updateTask,
    moveTask,
    addColumn,
    reorderColumns,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    addComment,
    addAttachment,
    removeAttachment,
  }
})
