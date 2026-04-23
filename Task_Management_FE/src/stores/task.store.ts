import { del, get, patch, post } from '@/api/client'
import { getTaskFileMetadata, type CloudinaryFileMetadata } from '@/api/cloudinary'
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
  parentCommentId?: string | null
  authorId: string
  text: string
  createdAt: string
}

export interface Attachment {
  id: string
  fileId?: string | null
  taskId: string
  name: string
  url: string
  type: 'image' | 'file'
  format?: string
  resourceType?: string
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
  parentTaskId?: string | null
  title: string
  description: string
  tags?: unknown
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  label: string
  labelBg: string
  labelColor: string
  start: string
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
  isDone?: boolean | null
}

type RawTask = {
  id?: string
  projectId?: string | null
  parentTaskId?: string | null
  title?: string | null
  description?: string | null
  priority?: string | null
  tags?: unknown
  startDate?: string | null
  dueDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  status?: RawTaskStatus | null
  assignees?: RawTaskAssignee[] | null
}

type RawComment = {
  id?: string
  taskId?: string
  parentCommentId?: string | null
  userId?: string
  user?: RawUser | null
  content?: string | null
  createdAt?: string | null
}

type RawTaskHistory = {
  id?: string
  taskId?: string
  userId?: string
  actionType?: string | null
  action?: string | null
  metadata?: HistoryMetadata | null
  createdAt?: string | null
}

type HistoryChange = {
  old?: unknown
  new?: unknown
}

type HistoryMetadata = Record<string, HistoryChange | undefined>

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
  label?: string
  labelBg?: string
  labelColor?: string
  startDate?: string
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

const MEMBER_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444',
  '#f97316',
]

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
  const trashTasks = ref<Task[]>([])
  const loading = ref(false)
  const loadingTrash = ref(false)
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

  function labelTags(label: string, labelBg?: string, labelColor?: string) {
    if (!label) return null

    const style = labelStyle(label)
    return {
      label,
      labelBg: labelBg || style.bg,
      labelColor: labelColor || style.color,
    }
  }

  function readTaskLabel(rawTags: unknown) {
    if (typeof rawTags === 'string') {
      try {
        return readTaskLabel(JSON.parse(rawTags))
      } catch {
        return { label: '', labelBg: labelStyle('').bg, labelColor: labelStyle('').color }
      }
    }

    if (!rawTags || typeof rawTags !== 'object' || Array.isArray(rawTags)) {
      return { label: '', labelBg: labelStyle('').bg, labelColor: labelStyle('').color }
    }

    const tags = rawTags as Record<string, unknown>
    const label = typeof tags.label === 'string' ? tags.label.trim() : ''
    const style = labelStyle(label)
    const labelBg = typeof tags.labelBg === 'string' ? tags.labelBg : style.bg
    const labelColor = typeof tags.labelColor === 'string' ? tags.labelColor : style.color

    if (label && !labelPresets[label]) {
      labelPresets[label] = { bg: labelBg, color: labelColor }
    }

    return { label, labelBg, labelColor }
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
    if (
      normalized === 'low' ||
      normalized === 'medium' ||
      normalized === 'high' ||
      normalized === 'urgent'
    ) {
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
    const assignees = rawAssignees
      .map(mapMember)
      .filter((member): member is Member => Boolean(member))
    const taskLabel = readTaskLabel(rawTask.tags)

    return {
      id: rawTask.id ?? '',
      parentTaskId: rawTask.parentTaskId ?? null,
      title: rawTask.title ?? '',
      description: rawTask.description ?? '',
      tags: rawTask.tags ?? null,
      status: rawTask.status?.id ?? '',
      priority: normalizePriority(rawTask.priority),
      label: taskLabel.label,
      labelBg: taskLabel.labelBg,
      labelColor: taskLabel.labelColor,
      start: rawTask.startDate ?? '',
      due: rawTask.dueDate ?? '',
      sprint: '',
      assignees,
      comments: 0,
      files: 0,
      createdAt: rawTask.createdAt ?? new Date().toISOString(),
      updatedAt: rawTask.updatedAt ?? new Date().toISOString(),
    }
  }

  function unwrapPayload<T>(response: T | { data?: T }): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data?: T }).data as T
    }

    return response as T
  }

  function unwrapList<T>(response: T[] | { data?: T[] }): T[] {
    if (Array.isArray(response)) return response
    return Array.isArray(response?.data) ? response.data : []
  }

  function upsertTask(rawTask: RawTask) {
    const nextTask = mapTask(rawTask)
    const idx = tasks.value.findIndex((task) => task.id === nextTask.id)

    if (idx >= 0) {
      // Some list endpoints can omit description; keep local value in that case.
      const hasDescription = Object.prototype.hasOwnProperty.call(rawTask, 'description')
      const hasTags = Object.prototype.hasOwnProperty.call(rawTask, 'tags')
      const nextDescription = hasDescription ? nextTask.description : tasks.value[idx].description
      const nextTags = hasTags ? nextTask.tags : tasks.value[idx].tags
      const nextLabel = hasTags ? nextTask.label : tasks.value[idx].label
      const nextLabelBg = hasTags ? nextTask.labelBg : tasks.value[idx].labelBg
      const nextLabelColor = hasTags ? nextTask.labelColor : tasks.value[idx].labelColor

      tasks.value[idx] = {
        ...tasks.value[idx],
        ...nextTask,
        description: nextDescription,
        tags: nextTags,
        label: nextLabel,
        labelBg: nextLabelBg,
        labelColor: nextLabelColor,
      }
      return
    }

    tasks.value.push(nextTask)
  }

  function replaceSubtasks(taskId: string, rawSubtasks: RawTask[]) {
    subtasks.value = subtasks.value.filter((subtask) => subtask.taskId !== taskId)
    subtasks.value.push(
      ...rawSubtasks.map((rawSubtask) => ({
        id: rawSubtask.id ?? '',
        taskId,
        title: rawSubtask.title ?? '',
        completed:
          Boolean(rawSubtask.status?.isDone) ||
          /done|complete/i.test(rawSubtask.status?.name ?? ''),
        assigneeId: rawSubtask.assignees?.[0]?.userId ?? rawSubtask.assignees?.[0]?.user?.id,
        dueDate: rawSubtask.dueDate ? rawSubtask.dueDate.slice(0, 10) : undefined,
      }))
    )
  }

  function replaceComments(taskId: string, rawComments: RawComment[]) {
    comments.value = comments.value.filter((comment) => comment.taskId !== taskId)
    upsertMembersFromComments(rawComments)
    comments.value.push(
      ...rawComments.map((rawComment) => ({
        id: rawComment.id ?? '',
        taskId,
        parentCommentId: rawComment.parentCommentId ?? null,
        authorId: rawComment.userId ?? 'system',
        text: rawComment.content ?? '',
        createdAt: rawComment.createdAt ?? new Date().toISOString(),
      }))
    )
    updateTask(taskId, { comments: commentsByTask(taskId).length })
  }

  function upsertMembersFromComments(rawComments: RawComment[]) {
    rawComments.forEach((rawComment) => {
      const id = rawComment.userId || rawComment.user?.id
      if (!id || members.value.some((member) => member.id === id)) return

      const name = getDisplayName(rawComment.user)
      members.value.push({
        id,
        name,
        initials: initialsFromName(name),
        color: colorFromSeed(id || name),
      })
    })
  }

  function formatHistoryAction(rawItem: RawTaskHistory) {
    const actionType = (rawItem.actionType ?? rawItem.action ?? 'UPDATED').toUpperCase()
    const metadata = rawItem.metadata ?? {}

    if (actionType === 'CREATED') {
      const title = formatHistoryValue(metadata.task?.new, 'task')
      return title ? `created task ${title}` : 'created this task'
    }

    if (actionType === 'STATUS_CHANGED' || metadata.status) {
      return formatChangeSentence('changed status', metadata.status)
    }

    if (actionType === 'ASSIGNED') {
      return `assigned ${formatAssigneeValue(metadata.assignee?.new)}`
    }

    if (actionType === 'UNASSIGNED') {
      return `unassigned ${formatAssigneeValue(metadata.assignee?.old)}`
    }

    if (actionType === 'COMMENTED') return 'commented on this task'
    if (actionType === 'COMMENT_UPDATED') return 'updated a comment'
    if (actionType === 'COMMENT_DELETED') return 'deleted a comment'

    if (actionType === 'DELETED') {
      const title = formatHistoryValue(metadata.task?.old, 'task')
      return title ? `deleted task ${title}` : 'deleted this task'
    }

    const detailedChanges = visibleHistoryChanges(metadata)
      .filter(([, change]) => change && ('old' in change || 'new' in change))
      .map(([field, change]) => formatFieldChange(field, change))
      .filter(Boolean)

    if (detailedChanges.length) {
      return `updated ${detailedChanges.join('; ')}`
    }

    return actionType.replace(/_/g, ' ').toLowerCase()
  }

  function visibleHistoryChanges(metadata: HistoryMetadata) {
    return Object.entries(metadata).filter(([field]) => field !== 'description')
  }

  function formatChangeSentence(prefix: string, change?: HistoryChange) {
    if (!change) return prefix
    const oldValue = formatHistoryValue(change.old)
    const newValue = formatHistoryValue(change.new)

    if (oldValue && newValue) return `${prefix} from ${oldValue} to ${newValue}`
    if (newValue) return `${prefix} to ${newValue}`
    if (oldValue) return `${prefix} from ${oldValue}`
    return prefix
  }

  function formatFieldChange(field: string, change?: HistoryChange) {
    if (!change) return ''
    const label = formatHistoryField(field)
    const oldValue = formatHistoryValue(change.old, field)
    const newValue = formatHistoryValue(change.new, field)

    if (oldValue && newValue) return `${label} from ${oldValue} to ${newValue}`
    if (newValue) return `${label} to ${newValue}`
    if (oldValue) return `removed ${label} ${oldValue}`
    return label
  }

  function formatHistoryField(field: string) {
    const labels: Record<string, string> = {
      title: 'title',
      description: 'description',
      priority: 'priority',
      status: 'status',
      statusId: 'status',
      startDate: 'start date',
      dueDate: 'due date',
      parentTaskId: 'parent task',
      assignee: 'assignee',
      task: 'task',
    }

    return (
      labels[field] ??
      field
        .replace(/Id$/, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
    )
  }

  function formatAssigneeValue(value: unknown) {
    if (value === null || value === undefined || value === '') return 'someone'
    const id = String(value)
    return getMember(id)?.name ?? shortId(id)
  }

  function formatHistoryValue(value: unknown, field = '') {
    if (value === null || value === undefined || value === '') return ''

    if (field === 'assignee') return formatAssigneeValue(value)

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      const title = record.title ?? record.name ?? record.fullName ?? record.email
      if (title) return quoteIfNeeded(String(title))
      if ('id' in record && record.id) return shortId(String(record.id))
      return ''
    }

    if (typeof value === 'boolean') return value ? 'yes' : 'no'

    const text = String(value)
    if (/date/i.test(field) || /^\d{4}-\d{2}-\d{2}/.test(text)) {
      const date = new Date(text)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }

    return quoteIfNeeded(text)
  }

  function quoteIfNeeded(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^[a-z0-9 _-]+$/i.test(trimmed) && trimmed.length <= 24) return trimmed
    return `"${trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed}"`
  }

  function shortId(id: string) {
    return id.length > 12 ? `${id.slice(0, 8)}...` : id
  }

  function replaceActivity(taskId: string, rawHistory: RawTaskHistory[]) {
    activityLogs.value = activityLogs.value.filter((activity) => activity.taskId !== taskId)
    activityLogs.value.push(
      ...rawHistory
        .filter((rawItem) => !isDescriptionOnlyHistory(rawItem))
        .map((rawItem) => ({
          id: rawItem.id ?? '',
          taskId,
          authorId: rawItem.userId ?? 'system',
          action: formatHistoryAction(rawItem),
          createdAt: rawItem.createdAt ?? new Date().toISOString(),
        }))
    )
  }

  function isDescriptionOnlyHistory(rawItem: RawTaskHistory) {
    const actionType = (rawItem.actionType ?? rawItem.action ?? 'UPDATED').toUpperCase()
    const metadata = rawItem.metadata ?? {}
    const visibleChanges = visibleHistoryChanges(metadata)

    return actionType === 'UPDATED' && Object.keys(metadata).length > 0 && visibleChanges.length === 0
  }

  function replaceAttachments(taskId: string, rawFiles: CloudinaryFileMetadata[]) {
    const existingTaskAttachments = attachments.value.filter(
      (attachment) => attachment.taskId === taskId
    )
    if (!rawFiles.length && existingTaskAttachments.length) {
      updateTask(taskId, { files: existingTaskAttachments.length })
      return
    }

    attachments.value = attachments.value.filter((attachment) => attachment.taskId !== taskId)
    attachments.value.push(
      ...rawFiles.map((file) => ({
        id: file.id ?? file.publicId,
        fileId: file.id,
        taskId,
        name: file.fileName || file.publicId.split('/').pop() || 'file',
        url: file.secureUrl,
        type: file.resourceType === 'image' ? ('image' as const) : ('file' as const),
        format: file.format,
        resourceType: file.resourceType,
        size: formatBytes(Number(file.bytes) || 0),
      }))
    )
    updateTask(taskId, { files: attachmentsByTask(taskId).length })
  }

  function formatBytes(bytes: number) {
    if (!bytes) return '0 KB'
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function firstOpenStatusId() {
    return (
      columns.value.find((column) => /todo|to do|backlog/i.test(column.title))?.id ??
      columns.value.find((column) => !/done|complete/i.test(column.title))?.id ??
      columns.value[0]?.id
    )
  }

  function doneStatusId() {
    return columns.value.find((column) => /done|complete/i.test(column.title))?.id
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
            nextTasks
              .flatMap((task) => task.assignees)
              .map((member) => [member.id, member] as const)
          ).values()
        )
  }

  function tasksByCol(colId: string) {
    return tasks.value.filter((task) => task.status === colId && !task.parentTaskId)
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

      const rawStatuses = Array.isArray(statusResponse)
        ? (statusResponse as RawProjectStatus[])
        : []

      const nextColumns = rawStatuses.length
        ? rawStatuses.map((status) => ({
            id: status.id ?? '',
            title: status.name ?? 'Untitled',
            icon: inferColumnIcon(status.name ?? '', Boolean(status.isDone)),
            color: status.color?.trim() || '#94a3b8',
          }))
        : []

      const nextTasks = Array.isArray((taskResponse as { data?: unknown[] })?.data)
        ? (taskResponse as { data: RawTask[] }).data.map(mapTask)
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

  async function loadProjectTrash(projectId: string) {
    loadingTrash.value = true

    try {
      const response = await taskService.listTasks({
        projectId,
        deleted: 'true',
        page: 1,
        limit: 100,
      })
      const rawTasks = Array.isArray((response as { data?: unknown[] })?.data)
        ? (response as { data: RawTask[] }).data
        : []

      trashTasks.value = rawTasks.map(mapTask)
    } finally {
      loadingTrash.value = false
    }
  }

  async function addMemberToProject(projectId: string, userId: string) {
    await addProjectMember(projectId, userId)
    await loadProjectBoard(projectId)
  }

  function resetProjectBoard() {
    replaceBoardData([...DEFAULT_COLUMNS], [])
    trashTasks.value = []
    loadedProjectId.value = null
  }

  async function createTaskInProject(payload: CreateProjectTaskPayload) {
    const priority = payload.priority.toUpperCase()
    const startDate = payload.startDate
      ? new Date(payload.startDate).toISOString()
      : undefined
    const dueDate = payload.dueDate
      ? new Date(payload.dueDate).toISOString()
      : undefined

    await taskService.createTask({
      title: payload.title,
      description: payload.description || undefined,
      projectId: payload.projectId,
      statusId: payload.statusId,
      priority,
      tags: labelTags(payload.label ?? '', payload.labelBg, payload.labelColor) ?? undefined,
      startDate,
      dueDate,
      assigneeIds: payload.assigneeIds?.length ? payload.assigneeIds : undefined,
    })

    await loadProjectBoard(payload.projectId)
  }

  async function createStatusInProject(payload: CreateProjectStatusPayload) {
    await taskService.createProjectStatus(payload.projectId, {
      name: payload.title,
      color: payload.color,
      isDone: false,
      isDefault: columns.value.length === 0,
    })

    await loadProjectBoard(payload.projectId)
  }

  async function updateStatusPosition(projectId: string, statusId: string, position: number) {
    await taskService.updateProjectStatus(projectId, statusId, { position })
    await loadProjectBoard(projectId)
  }

  async function updateStatusInProject(
    projectId: string,
    statusId: string,
    data: { title?: string; color?: string }
  ) {
    await taskService.updateProjectStatus(projectId, statusId, {
      ...(data.title !== undefined && { name: data.title }),
      ...(data.color !== undefined && { color: data.color }),
    })
    await loadProjectBoard(projectId)
  }

  async function deleteStatusInProject(
    projectId: string,
    statusId: string,
    moveToStatusId?: string
  ) {
    // If there are tasks in this status and a migration target is given, move them first
    if (moveToStatusId) {
      const affectedTaskIds = tasks.value
        .filter((t) => t.status === statusId && !t.parentTaskId)
        .map((t) => t.id)
      await Promise.all(
        affectedTaskIds.map((taskId) =>
          taskService.updateTask(taskId, { statusId: moveToStatusId } as never)
        )
      )
    }
    await taskService.deleteProjectStatus(projectId, statusId)
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

  async function loadTaskDetail(taskId: string) {
    const taskResponse = await get<RawTask | { data?: RawTask }>(`/tasks/${taskId}`)
    const rawTask = unwrapPayload(taskResponse)
    upsertTask(rawTask)

    if (rawTask.projectId && loadedProjectId.value !== rawTask.projectId) {
      await loadProjectBoard(rawTask.projectId)
      upsertTask(rawTask)
    }

    const [subtaskResponse, commentResponse, historyResponse, fileResponse] = await Promise.all([
      get<RawTask[] | { data?: RawTask[] }>(`/tasks/parent/${taskId}`, {
        params: { page: 1, limit: 100 },
      }),
      get<RawComment[] | { data?: RawComment[] }>(`/tasks/${taskId}/comments`, {
        params: { page: 1, limit: 100 },
      }),
      get<RawTaskHistory[] | { data?: RawTaskHistory[] }>(`/tasks/${taskId}/history`, {
        params: { page: 1, limit: 100 },
      }),
      rawTask.projectId ? getTaskFileMetadata(rawTask.projectId, taskId) : Promise.resolve([]),
    ])

    replaceSubtasks(taskId, unwrapList(subtaskResponse))
    replaceComments(taskId, unwrapList(commentResponse))
    replaceActivity(taskId, unwrapList(historyResponse))
    replaceAttachments(taskId, fileResponse)
  }

  async function updateTaskRemote(taskId: string, data: Record<string, unknown>) {
    const response = await patch<RawTask | { data?: RawTask }>(`/tasks/${taskId}`, data)
    upsertTask(unwrapPayload(response))
    await loadTaskDetail(taskId)
  }

  async function updateTaskLabelRemote(
    taskId: string,
    label: string,
    labelBg?: string,
    labelColor?: string
  ) {
    await updateTaskRemote(taskId, {
      tags: labelTags(label, labelBg, labelColor),
    })
  }

  async function createSubtaskRemote(taskId: string, title: string) {
    const parentTask = getTask(taskId)
    const statusId = firstOpenStatusId()
    if (!parentTask || !loadedProjectId.value || !statusId) return

    await post('/tasks', {
      title,
      projectId: loadedProjectId.value,
      parentTaskId: taskId,
      statusId,
      priority: parentTask.priority.toUpperCase(),
    })

    await loadTaskDetail(taskId)
  }

  async function updateSubtaskRemote(
    parentTaskId: string,
    subtaskId: string,
    data: Record<string, unknown>
  ) {
    await patch(`/tasks/${subtaskId}`, data)
    await loadTaskDetail(parentTaskId)
  }

  async function toggleSubtaskRemote(parentTaskId: string, subtaskId: string) {
    const subtask = subtasks.value.find((item) => item.id === subtaskId)
    const statusId = subtask?.completed ? firstOpenStatusId() : doneStatusId()
    if (!statusId) return

    await updateSubtaskRemote(parentTaskId, subtaskId, { statusId })
  }

  async function deleteSubtaskRemote(parentTaskId: string, subtaskId: string) {
    await del(`/tasks/${subtaskId}`)
    await loadTaskDetail(parentTaskId)
  }

  async function addCommentRemote(taskId: string, text: string, parentCommentId?: string) {
    await post(`/tasks/${taskId}/comments`, {
      content: text,
      parentCommentId,
    })
    await loadTaskDetail(taskId)
  }

  async function deleteCommentRemote(taskId: string, commentId: string) {
    await del(`/tasks/${taskId}/comments/${commentId}`)
    await loadTaskDetail(taskId)
  }

  async function assignTaskMemberRemote(taskId: string, memberId: string) {
    await post(`/tasks/${taskId}/assignees`, { userId: memberId })
    await loadTaskDetail(taskId)
  }

  async function unassignTaskMemberRemote(taskId: string, memberId: string) {
    await del(`/tasks/${taskId}/assignees/${memberId}`)
    await loadTaskDetail(taskId)
  }

  async function deleteTaskRemote(taskId: string, projectId?: string | null) {
    await taskService.deleteTask(taskId)
    tasks.value = tasks.value.filter((task) => task.id !== taskId)
    subtasks.value = subtasks.value.filter((subtask) => subtask.taskId !== taskId)
    comments.value = comments.value.filter((comment) => comment.taskId !== taskId)
    activityLogs.value = activityLogs.value.filter((activity) => activity.taskId !== taskId)
    attachments.value = attachments.value.filter((attachment) => attachment.taskId !== taskId)

    const nextProjectId = projectId ?? loadedProjectId.value
    if (nextProjectId) {
      await loadProjectTrash(nextProjectId)
    }
  }

  async function restoreTaskRemote(taskId: string, projectId?: string | null) {
    const response = await patch<RawTask | { data?: RawTask }>(`/tasks/${taskId}/restore`, {})
    const restoredTask = unwrapPayload(response)
    trashTasks.value = trashTasks.value.filter((task) => task.id !== taskId)
    upsertTask(restoredTask)

    const nextProjectId = projectId ?? restoredTask.projectId ?? loadedProjectId.value
    if (nextProjectId) {
      await loadProjectBoard(nextProjectId)
      await loadProjectTrash(nextProjectId)
    }
  }

  function addTask(
    data: Omit<Task, 'id' | 'start' | 'createdAt' | 'updatedAt' | 'comments' | 'files'>
  ) {
    const lc = labelStyle(data.label)
    tasks.value.push({
      ...data,
      id: `task_${Date.now()}`,
      start: '',
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
      parentCommentId: null,
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
    const id = att.fileId ?? `att_${Date.now()}`
    const idx = attachments.value.findIndex((attachment) => attachment.id === id)
    const nextAttachment = { ...att, id, taskId }

    if (idx >= 0) {
      attachments.value[idx] = nextAttachment
    } else {
      attachments.value.push(nextAttachment)
    }

    updateTask(taskId, { files: attachmentsByTask(taskId).length })
  }

  function removeAttachment(id: string) {
    const attachment = attachments.value.find((item) => item.id === id)
    if (!attachment) return
    attachments.value = attachments.value.filter((item) => item.id !== id)
    updateTask(attachment.taskId, { files: attachmentsByTask(attachment.taskId).length })
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
    trashTasks,
    loading,
    loadingTrash,
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
    loadProjectTrash,
    resetProjectBoard,
    addMemberToProject,
    createTaskInProject,
    createStatusInProject,
    updateStatusInProject,
    deleteStatusInProject,
    updateStatusPosition,
    moveTaskToStatus,
    loadTaskDetail,
    updateTaskRemote,
    updateTaskLabelRemote,
    createSubtaskRemote,
    updateSubtaskRemote,
    toggleSubtaskRemote,
    deleteSubtaskRemote,
    addCommentRemote,
    deleteCommentRemote,
    assignTaskMemberRemote,
    unassignTaskMemberRemote,
    deleteTaskRemote,
    restoreTaskRemote,
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
