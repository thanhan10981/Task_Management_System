import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTaskStore = defineStore('tasks', () => {
  // ── Members ────────────────────────────────────────────────────────────────
  const members = ref<Member[]>([
    { id: 'A', name: 'Alice Johnson', initials: 'AJ', color: '#6366f1' },
    { id: 'B', name: 'Bob Smith',     initials: 'BS', color: '#ec4899' },
    { id: 'C', name: 'Carol White',   initials: 'CW', color: '#f59e0b' },
    { id: 'D', name: 'David Lee',     initials: 'DL', color: '#10b981' },
  ])

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = ref<Column[]>([
    { id: 'backlog',     title: 'Backlog',     icon: '📋', color: '#94a3b8' },
    { id: 'todo',        title: 'To Do',       icon: '⬜', color: '#6366f1' },
    { id: 'in_progress', title: 'In Progress', icon: '🔄', color: '#f59e0b' },
    { id: 'review',      title: 'Review',      icon: '👁️', color: '#8b5cf6' },
    { id: 'done',        title: 'Done',        icon: '✅', color: '#10b981' },
  ])

  // ── Sprints ────────────────────────────────────────────────────────────────
  const sprints = ref([
    { id: 'sprint1', title: 'Sprint 1 — Apr 2026' },
    { id: 'sprint2', title: 'Sprint 2 — May 2026' },
    { id: 'sprint3', title: 'Sprint 3 — Jun 2026' },
  ])

  // ── Label presets ──────────────────────────────────────────────────────────
  const labelPresets: Record<string, { bg: string; color: string }> = {
    Design:   { bg: '#dbeafe', color: '#2563eb' },
    Research: { bg: '#d1fae5', color: '#059669' },
    Planning: { bg: '#fef9c3', color: '#b45309' },
    Dev:      { bg: '#ede9fe', color: '#7c3aed' },
    QA:       { bg: '#fee2e2', color: '#dc2626' },
    DevOps:   { bg: '#d1fae5', color: '#059669' },
    Content:  { bg: '#fce7f3', color: '#be185d' },
    UX:       { bg: '#e0f2fe', color: '#0369a1' },
  }

  function labelStyle(label: string) {
    return labelPresets[label] ?? { bg: '#f1f5f9', color: '#475569' }
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks = ref<Task[]>([
    {
      id: '1', title: 'Create styleguide foundation',
      description: 'Define color palettes, typography, spacing tokens and component primitives for the Peceland design system.',
      status: 'backlog', priority: 'high', label: 'Design', labelBg: '#dbeafe', labelColor: '#2563eb',
      due: '2026-04-17', sprint: 'sprint1',
      assignees: [
        { id: 'A', name: 'Alice Johnson', initials: 'AJ', color: '#6366f1' },
        { id: 'B', name: 'Bob Smith',     initials: 'BS', color: '#ec4899' },
      ],
      comments: 4, files: 8,
      createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-17T10:30:00Z',
    },
    {
      id: '2', title: 'Copywriting Content',
      description: 'Create content for Peceland App landing page and onboarding flow.',
      status: 'backlog', priority: 'medium', label: 'Research', labelBg: '#d1fae5', labelColor: '#059669',
      due: '2026-04-19', sprint: '',
      assignees: [{ id: 'C', name: 'Carol White', initials: 'CW', color: '#f59e0b' }],
      comments: 0, files: 8,
      createdAt: '2026-04-02T09:00:00Z', updatedAt: '2026-04-19T11:00:00Z',
    },
    {
      id: '3', title: 'Update requirement list',
      description: '',
      status: 'backlog', priority: 'low', label: 'Planning', labelBg: '#fef9c3', labelColor: '#b45309',
      due: '2026-04-24', sprint: 'sprint1',
      assignees: [{ id: 'D', name: 'David Lee', initials: 'DL', color: '#10b981' }],
      comments: 4, files: 11,
      createdAt: '2026-04-03T09:00:00Z', updatedAt: '2026-04-20T08:00:00Z',
    },
    {
      id: '4', title: 'Auth screens design',
      description: 'Login, signup & reset flows with proper error states and loading indicators.',
      status: 'todo', priority: 'high', label: 'Design', labelBg: '#dbeafe', labelColor: '#2563eb',
      due: '2026-04-20', sprint: 'sprint2',
      assignees: [
        { id: 'A', name: 'Alice Johnson', initials: 'AJ', color: '#6366f1' },
        { id: 'D', name: 'David Lee',     initials: 'DL', color: '#10b981' },
      ],
      comments: 2, files: 3,
      createdAt: '2026-04-05T09:00:00Z', updatedAt: '2026-04-20T09:00:00Z',
    },
    {
      id: '5', title: 'API integration tasks module',
      description: 'Connect REST endpoints for task CRUD operations with optimistic UI updates.',
      status: 'in_progress', priority: 'urgent', label: 'Dev', labelBg: '#ede9fe', labelColor: '#7c3aed',
      due: '2026-04-22', sprint: 'sprint2',
      assignees: [{ id: 'B', name: 'Bob Smith', initials: 'BS', color: '#ec4899' }],
      comments: 5, files: 0,
      createdAt: '2026-04-08T09:00:00Z', updatedAt: '2026-04-22T07:00:00Z',
    },
    {
      id: '6', title: 'Unit tests for auth module',
      description: 'Write comprehensive unit and integration tests for authentication flows.',
      status: 'review', priority: 'medium', label: 'QA', labelBg: '#fee2e2', labelColor: '#dc2626',
      due: '2026-04-25', sprint: 'sprint2',
      assignees: [{ id: 'C', name: 'Carol White', initials: 'CW', color: '#f59e0b' }],
      comments: 1, files: 2,
      createdAt: '2026-04-10T09:00:00Z', updatedAt: '2026-04-22T06:00:00Z',
    },
    {
      id: '7', title: 'Deploy staging environment',
      description: 'AWS EC2 + nginx setup with CI/CD pipeline via GitHub Actions.',
      status: 'done', priority: 'high', label: 'DevOps', labelBg: '#d1fae5', labelColor: '#059669',
      due: '2026-04-15', sprint: 'sprint1',
      assignees: [{ id: 'A', name: 'Alice Johnson', initials: 'AJ', color: '#6366f1' }],
      comments: 3, files: 1,
      createdAt: '2026-04-12T09:00:00Z', updatedAt: '2026-04-15T16:00:00Z',
    },
  ])

  // ── Subtasks ───────────────────────────────────────────────────────────────
  const subtasks = ref<Subtask[]>([
    { id: 'st1', taskId: '1', title: 'Define color palette tokens',    completed: true,  assigneeId: 'A', dueDate: '2026-04-10' },
    { id: 'st2', taskId: '1', title: 'Typography scale & font pairs',  completed: true,  assigneeId: 'B', dueDate: '' },
    { id: 'st3', taskId: '1', title: 'Spacing & grid system',          completed: false, assigneeId: 'A', dueDate: '2026-04-15' },
    { id: 'st4', taskId: '1', title: 'Button component variants',       completed: false, assigneeId: undefined, dueDate: '' },
    { id: 'st5', taskId: '1', title: 'Icon set selection & export',     completed: false, assigneeId: undefined, dueDate: '' },

    { id: 'st6', taskId: '4', title: 'Wireframe login screen',         completed: true,  assigneeId: 'A', dueDate: '' },
    { id: 'st7', taskId: '4', title: 'Review with team',               completed: false, assigneeId: 'D', dueDate: '2026-04-18' },
    { id: 'st8', taskId: '4', title: 'Final UI polish',                 completed: false, assigneeId: undefined, dueDate: '' },

    { id: 'st9',  taskId: '5', title: 'Setup axios interceptors',       completed: true,  assigneeId: 'B', dueDate: '' },
    { id: 'st10', taskId: '5', title: 'Task list endpoint integration', completed: true,  assigneeId: 'B', dueDate: '' },
    { id: 'st11', taskId: '5', title: 'Create task endpoint',           completed: false, assigneeId: 'B', dueDate: '' },
    { id: 'st12', taskId: '5', title: 'Update & delete endpoints',      completed: false, assigneeId: undefined, dueDate: '' },
  ])

  // ── Comments ───────────────────────────────────────────────────────────────
  const comments = ref<Comment[]>([
    { id: 'c1', taskId: '1', authorId: 'B', text: 'Looking great! Love the color direction.', createdAt: '2026-04-17T10:00:00Z' },
    { id: 'c2', taskId: '1', authorId: 'A', text: 'Thanks! Working on the spacing tokens next.', createdAt: '2026-04-17T11:30:00Z' },
    { id: 'c3', taskId: '5', authorId: 'C', text: 'Should we use @tanstack/vue-query here?', createdAt: '2026-04-21T09:00:00Z' },
  ])

  // ── Activity Logs ──────────────────────────────────────────────────────────
  const activityLogs = ref<ActivityLog[]>([
    { id: 'al1', taskId: '1', authorId: 'A', action: 'created this task', createdAt: '2026-04-01T09:00:00Z' },
    { id: 'al2', taskId: '1', authorId: 'B', action: 'moved task to Backlog', createdAt: '2026-04-10T14:00:00Z' },
    { id: 'al3', taskId: '4', authorId: 'A', action: 'created this task', createdAt: '2026-04-05T09:00:00Z' },
    { id: 'al4', taskId: '4', authorId: 'D', action: 'moved task to To Do', createdAt: '2026-04-12T10:00:00Z' },
    { id: 'al5', taskId: '5', authorId: 'B', action: 'moved task to In Progress', createdAt: '2026-04-20T08:00:00Z' },
  ])

  // ── Attachments ────────────────────────────────────────────────────────────
  const attachments = ref<Attachment[]>([
    { id: 'att1', taskId: '1', name: 'styleguide-v1.png', url: 'https://picsum.photos/seed/style1/200/120', type: 'image', size: '2.4 MB' },
    { id: 'att2', taskId: '1', name: 'tokens.json', url: '', type: 'file', size: '14 KB' },
  ])

  // ── Computed ───────────────────────────────────────────────────────────────
  function tasksByCol(colId: string) {
    return tasks.value.filter(t => t.status === colId)
  }

  function subtasksByTask(taskId: string) {
    return subtasks.value.filter(s => s.taskId === taskId)
  }

  function subtaskProgress(taskId: string) {
    const all = subtasksByTask(taskId)
    const done = all.filter(s => s.completed).length
    return { done, total: all.length }
  }

  function commentsByTask(taskId: string) {
    return comments.value.filter(c => c.taskId === taskId)
  }

  function activityByTask(taskId: string) {
    return activityLogs.value.filter(a => a.taskId === taskId)
  }

  function attachmentsByTask(taskId: string) {
    return attachments.value.filter(a => a.taskId === taskId)
  }

  function getMember(id: string) {
    return members.value.find(m => m.id === id)
  }

  function getTask(id: string) {
    return tasks.value.find(t => t.id === id)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

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
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx < 0) return
    if (patch.label && !patch.labelBg) {
      const lc = labelStyle(patch.label)
      patch.labelBg = lc.bg
      patch.labelColor = lc.color
    }
    tasks.value[idx] = { ...tasks.value[idx], ...patch, updatedAt: new Date().toISOString() }
  }

  function moveTask(taskId: string, newStatus: string, authorId = 'A') {
    const task = getTask(taskId)
    if (!task) return
    const oldStatus = task.status
    updateTask(taskId, { status: newStatus })
    const col = columns.value.find(c => c.id === newStatus)
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

  // Subtask actions
  function addSubtask(taskId: string, title: string) {
    subtasks.value.push({
      id: `st_${Date.now()}`,
      taskId,
      title,
      completed: false,
    })
  }

  function updateSubtask(id: string, patch: Partial<Subtask>) {
    const idx = subtasks.value.findIndex(s => s.id === id)
    if (idx < 0) return
    subtasks.value[idx] = { ...subtasks.value[idx], ...patch }
  }

  function toggleSubtask(id: string) {
    const st = subtasks.value.find(s => s.id === id)
    if (!st) return
    st.completed = !st.completed
  }

  function deleteSubtask(id: string) {
    subtasks.value = subtasks.value.filter(s => s.id !== id)
  }

  // Comment actions
  function addComment(taskId: string, text: string, authorId = 'A') {
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

  // Attachment actions
  function addAttachment(taskId: string, att: Omit<Attachment, 'id' | 'taskId'>) {
    attachments.value.push({ ...att, id: `att_${Date.now()}`, taskId })
    updateTask(taskId, { files: attachmentsByTask(taskId).length + 1 })
  }

  function removeAttachment(id: string) {
    const att = attachments.value.find(a => a.id === id)
    if (!att) return
    attachments.value = attachments.value.filter(a => a.id !== id)
    updateTask(att.taskId, { files: attachmentsByTask(att.taskId).length - 1 })
  }

  return {
    // state
    members, columns, sprints, tasks, subtasks, comments, activityLogs, attachments,
    // getters
    tasksByCol, subtasksByTask, subtaskProgress,
    commentsByTask, activityByTask, attachmentsByTask,
    getMember, getTask, labelStyle, labelPresets,
    // actions
    addTask, updateTask, moveTask,
    addColumn, reorderColumns,
    addSubtask, updateSubtask, toggleSubtask, deleteSubtask,
    addComment, addAttachment, removeAttachment,
  }
})
