import type { ComputedRef, Ref } from 'vue'
import { computed, nextTick, ref } from 'vue'

export type BoardStatusColumn = {
  id: string
  title: string
  color: string
  emptyIcon?: string
  emptyText?: string
}

type NewStatus = {
  name: string
  color: string
  icon: string
  desc: string
  title: string
  iconId: string
}

type StatusIconOption = {
  value: string
  label: string
  svg: string
}

type UseBoardStatusesDeps<TaskItem> = {
  columns: BoardStatusColumn[]
  currentTasks: ComputedRef<TaskItem[]>
  effectiveProjectId: ComputedRef<string | null>
  sprintMenuOpen: Ref<boolean>
  activeCardMenu: Ref<string | null>
  columnList: (colId: string) => TaskItem[]
  createStatusInProject: (payload: {
    projectId: string
    title: string
    color: string
    icon: string
  }) => Promise<unknown>
  updateStatusInProject: (
    projectId: string,
    statusId: string,
    payload: { title: string }
  ) => Promise<unknown>
  deleteStatusInProject: (
    projectId: string,
    statusId: string,
    moveTasksToStatusId?: string
  ) => Promise<unknown>
  syncProjectBoard: (projectId: string | null) => Promise<void>
  toast: {
    success: (message: string) => void
    error: (message: string) => void
  }
  taskStatus: (task: TaskItem) => string
}

const STATUS_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#10b981', '#14b8a6', '#0ea5e9', '#3b82f6',
  '#64748b', '#94a3b8', '#1e293b', '#0f172a',
]

const DEFAULT_STATUS = {
  name: '',
  color: '#6366f1',
  icon: 'square',
  desc: '',
  title: '',
  iconId: 'list',
}

const statusSvg = (path: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`

const STATUS_ICON_OPTIONS: StatusIconOption[] = [
  { value: 'list', label: 'List', svg: statusSvg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>') },
  { value: 'check', label: 'Checkmark', svg: statusSvg('<polyline points="20 6 9 17 4 12"/>') },
  { value: 'circle', label: 'Circle', svg: statusSvg('<circle cx="12" cy="12" r="9"/>') },
  { value: 'clock', label: 'Clock', svg: statusSvg('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>') },
  { value: 'eye', label: 'Review', svg: statusSvg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>') },
  { value: 'flag', label: 'Flag', svg: statusSvg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>') },
  { value: 'zap', label: 'Zap', svg: statusSvg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>') },
  { value: 'target', label: 'Target', svg: statusSvg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>') },
]

function normalizeStatusName(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, '')
}

export function useBoardStatuses<TaskItem>(deps: UseBoardStatusesDeps<TaskItem>) {
  const statusPanelOpen = ref(false)
  const newStatus = ref<NewStatus>({ ...DEFAULT_STATUS })
  const submittingStatus = ref(false)

  const openColMenuId = ref<string | null>(null)
  const colMenuRefs: Record<string, HTMLElement> = {}
  const editingColId = ref<string | null>(null)
  const editingColTitle = ref('')
  const colEditInputs: Record<string, HTMLInputElement> = {}

  const deleteColTarget = ref<BoardStatusColumn | null>(null)
  const deleteColMoveTarget = ref('')
  const deletingCol = ref(false)

  function statusIdsMatching(match: (normalizedTitle: string, normalizedId: string) => boolean) {
    return new Set(
      deps.columns
        .filter((col) => match(normalizeStatusName(col.title), normalizeStatusName(col.id)))
        .map((col) => col.id)
    )
  }

  const doneStatusIds = computed(() =>
    statusIdsMatching((title, id) => title === 'done' || title.includes('complete') || id === 'done' || id.includes('complete'))
  )

  const sprintProgress = computed(() => {
    const tasks = deps.currentTasks.value
    if (!tasks.length) return 0
    const doneCount = tasks.filter((task) => doneStatusIds.value.has(deps.taskStatus(task))).length
    return Math.round((doneCount / tasks.length) * 100)
  })

  const deleteColTaskCount = computed(() =>
    deleteColTarget.value ? deps.columnList(deleteColTarget.value.id).length : 0
  )

  function resetNewStatus() {
    newStatus.value = { ...DEFAULT_STATUS }
  }

  async function createStatus() {
    const projectId = deps.effectiveProjectId.value
    if (!newStatus.value.title.trim() || !projectId) return

    submittingStatus.value = true
    let created = false
    try {
      await deps.createStatusInProject({
        projectId,
        title: newStatus.value.title.trim(),
        color: newStatus.value.color,
        icon: newStatus.value.iconId,
      })
      created = true
      resetNewStatus()
      statusPanelOpen.value = false
      deps.toast.success('Status created successfully')
    } catch {
      deps.toast.error('Cannot create status')
    } finally {
      submittingStatus.value = false
    }

    if (created) {
      deps.syncProjectBoard(projectId).catch(() => undefined)
    }
  }

  function toggleColMenu(colId: string) {
    openColMenuId.value = openColMenuId.value === colId ? null : colId
    deps.sprintMenuOpen.value = false
    deps.activeCardMenu.value = null
  }

  function onDocColMenuClick(e: MouseEvent) {
    if (openColMenuId.value) {
      const menuEl = colMenuRefs[openColMenuId.value]
      if (!menuEl || !menuEl.contains(e.target as Node)) openColMenuId.value = null
    }
  }

  async function startColEdit(col: BoardStatusColumn) {
    openColMenuId.value = null
    editingColId.value = col.id
    editingColTitle.value = col.title
    await nextTick()
    colEditInputs[col.id]?.focus()
    colEditInputs[col.id]?.select()
  }

  function cancelColEdit() {
    editingColId.value = null
    editingColTitle.value = ''
  }

  async function saveColEdit() {
    const id = editingColId.value
    const title = editingColTitle.value.trim()
    if (!id || !title || !deps.effectiveProjectId.value) {
      cancelColEdit()
      return
    }

    cancelColEdit()
    try {
      await deps.updateStatusInProject(deps.effectiveProjectId.value, id, { title })
      await deps.syncProjectBoard(deps.effectiveProjectId.value)
      deps.toast.success('Status updated')
    } catch {
      deps.toast.error('Cannot update status')
    }
  }

  function startColDelete(col: BoardStatusColumn) {
    openColMenuId.value = null
    deleteColTarget.value = col
    deleteColMoveTarget.value = ''
  }

  function cancelColDelete() {
    deleteColTarget.value = null
    deleteColMoveTarget.value = ''
  }

  async function confirmColDelete() {
    const col = deleteColTarget.value
    if (!col || !deps.effectiveProjectId.value) return
    if (deleteColTaskCount.value > 0 && !deleteColMoveTarget.value) {
      deps.toast.error('Please select a status to move tasks to')
      return
    }

    deletingCol.value = true
    try {
      await deps.deleteStatusInProject(
        deps.effectiveProjectId.value,
        col.id,
        deleteColMoveTarget.value || undefined
      )
      await deps.syncProjectBoard(deps.effectiveProjectId.value)
      deps.toast.success(`Status "${col.title}" deleted`)
      cancelColDelete()
    } catch {
      deps.toast.error('Cannot delete status')
    } finally {
      deletingCol.value = false
    }
  }

  return {
    statusPanelOpen,
    statusColors: STATUS_COLORS,
    statusIconOptions: STATUS_ICON_OPTIONS,
    newStatus,
    submittingStatus,
    resetNewStatus,
    createStatus,
    sprintProgress,
    openColMenuId,
    colMenuRefs,
    toggleColMenu,
    onDocColMenuClick,
    editingColId,
    editingColTitle,
    colEditInputs,
    startColEdit,
    cancelColEdit,
    saveColEdit,
    deleteColTarget,
    deleteColMoveTarget,
    deletingCol,
    deleteColTaskCount,
    startColDelete,
    cancelColDelete,
    confirmColDelete,
  }
}
