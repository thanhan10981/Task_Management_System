import type { SprintSummary } from '@/api/sprints'
import { fetchProjectSprintsQuery } from '@/features/tasks/composables/useSprintsQuery'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

type SprintMember = {
  initial: string
  name: string
  color: string
}

export type BoardSprint = {
  id: string
  name: string
  color: string
  dates: string
  members: SprintMember[]
}

type UseBoardSprintsDeps = {
  effectiveProjectId: ComputedRef<string | null>
  createSprint: (input: {
    projectId: string
    name: string
    startDate?: string
    endDate?: string
  }) => Promise<{ id: string }>
  onSprintCreated: (id: string) => void
  toast: {
    error: (message: string) => void
  }
  activeCardMenu: Ref<string | null>
}

const EMPTY_SPRINT: BoardSprint = { id: '', name: 'Backlog', color: '#64748b', dates: '', members: [] }
const SPRINT_SELECTION_KEY_PREFIX = 'board_selected_sprint'
const SPRINT_COLOR_OPTIONS = ['#10b981','#6366f1','#f59e0b','#ec4899','#0ea5e9','#ef4444','#8b5cf6','#84cc16']

function formatSprintDates(start: string, end: string): string {
  if (!start && !end) return ''
  const fmt = (d: string) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end)}`
}

export function useBoardSprints(deps: UseBoardSprintsDeps) {
  const sprints = ref<BoardSprint[]>([])
  const selectedSprintId = ref('')
  const sprintMenuOpen = ref(false)
  const sprintBtnRef = ref<HTMLElement | null>(null)
  const sprintDropStyle = ref<Record<string, string>>({})
  const showNewSprintForm = ref(false)
  const newSprint = ref({ name: '', startDate: '', endDate: '', color: '#6366f1' })
  const remoteSprintCache = ref<SprintSummary[]>([])

  const currentSprint = computed(
    () => sprints.value.find((s) => s.id === selectedSprintId.value) ?? sprints.value[0] ?? EMPTY_SPRINT
  )

  function sprintSelectionKey(projectId: string) {
    return `${SPRINT_SELECTION_KEY_PREFIX}:${projectId}`
  }

  function persistSelectedSprint(id: string) {
    if (!deps.effectiveProjectId.value) return
    localStorage.setItem(sprintSelectionKey(deps.effectiveProjectId.value), id)
  }

  function restoreSelectedSprint(projectId: string) {
    const savedId = localStorage.getItem(sprintSelectionKey(projectId)) ?? ''
    selectedSprintId.value = sprints.value.some((sprint) => sprint.id === savedId) ? savedId : ''
  }

  function updateSprintDropPos() {
    const btn = sprintBtnRef.value
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const viewportW = window.innerWidth
    const isMobile = viewportW < 768
    const dropWidth = isMobile ? Math.min(260, viewportW - 24) : 230
    const sidePadding = isMobile ? 12 : 8
    const left = Math.max(sidePadding, Math.min(rect.left, viewportW - dropWidth - sidePadding))
    sprintDropStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${left}px`,
      ...(isMobile ? { width: `${dropWidth}px` } : {}),
    }
  }

  function toggleSprintMenu() {
    if (!sprintMenuOpen.value) updateSprintDropPos()
    sprintMenuOpen.value = !sprintMenuOpen.value
    if (sprintMenuOpen.value) deps.activeCardMenu.value = null
  }

  function selectSprint(id: string) {
    selectedSprintId.value = id
    persistSelectedSprint(id)
    sprintMenuOpen.value = false
    showNewSprintForm.value = false
  }

  async function createSprint() {
    if (!newSprint.value.name.trim() || !deps.effectiveProjectId.value) return

    try {
      const created = await deps.createSprint({
        projectId: deps.effectiveProjectId.value,
        name: newSprint.value.name.trim(),
        startDate: newSprint.value.startDate ? new Date(newSprint.value.startDate).toISOString() : undefined,
        endDate: newSprint.value.endDate ? new Date(newSprint.value.endDate).toISOString() : undefined,
      })

      await loadProjectSprints(deps.effectiveProjectId.value)
      selectedSprintId.value = created.id
      persistSelectedSprint(created.id)
      deps.onSprintCreated(created.id)
      sprintMenuOpen.value = false
      showNewSprintForm.value = false
      newSprint.value = { name: '', startDate: '', endDate: '', color: '#6366f1' }
    } catch {
      deps.toast.error('Cannot create sprint')
    }
  }

  async function loadProjectSprints(projectId: string) {
    remoteSprintCache.value = await fetchProjectSprintsQuery(projectId)
    sprints.value = [
      { id: '', name: 'Backlog', color: '#64748b', dates: 'No sprint', members: [] },
      ...remoteSprintCache.value.map((sprint, index) => ({
        id: sprint.id,
        name: sprint.name,
        color: SPRINT_COLOR_OPTIONS[index % SPRINT_COLOR_OPTIONS.length],
        dates: formatSprintDates(sprint.startDate ?? '', sprint.endDate ?? ''),
        members: [],
      })),
    ]
    restoreSelectedSprint(projectId)
  }

  return {
    sprints,
    selectedSprintId,
    sprintMenuOpen,
    sprintBtnRef,
    sprintDropStyle,
    currentSprint,
    showNewSprintForm,
    sprintColorOptions: SPRINT_COLOR_OPTIONS,
    newSprint,
    remoteSprintCache,
    updateSprintDropPos,
    toggleSprintMenu,
    selectSprint,
    createSprint,
    loadProjectSprints,
    persistSelectedSprint,
  }
}
