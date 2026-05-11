import { createProject, listUserProjects } from '@/api/projects'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CreateProjectPayload, ProjectSummary } from '@/types/project.types'
import { queryClient } from '@/lib/query-client'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const LAST_PROJECT_STORAGE_KEY = 'lastProjectId'
const LEGACY_PROJECT_STORAGE_KEY = 'current_project_id'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectSummary[]>([])
  const currentProjectId = ref<string | null>(null)
  const loadingProjects = ref(false)
  const initialized = ref(false)
  const projectContextResolved = ref(false)
  let initializePromise: Promise<void> | null = null

  const hasProjects = computed(() => projects.value.length > 0)
  const currentProject = computed(() =>
    projects.value.find((project) => project.id === currentProjectId.value) ?? null,
  )
  const hasCurrentProject = computed(() => Boolean(currentProject.value))

  function getStoredLastProjectId() {
    return (
      localStorage.getItem(LAST_PROJECT_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_PROJECT_STORAGE_KEY)
    )
  }

  function setCurrentProjectId(
    projectId: string | null,
    options?: { persist?: boolean; clearStored?: boolean }
  ) {
    currentProjectId.value = projectId

    if (projectId && options?.persist) {
      localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId)
      localStorage.setItem(LEGACY_PROJECT_STORAGE_KEY, projectId)
      return
    }

    if (options?.clearStored) {
      localStorage.removeItem(LAST_PROJECT_STORAGE_KEY)
      localStorage.removeItem(LEGACY_PROJECT_STORAGE_KEY)
    }
  }

  async function loadProjects() {
    loadingProjects.value = true
    try {
      projects.value = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.projects.list(),
        queryFn: () => listUserProjects(),
      })

      const storedProjectId = getStoredLastProjectId()
      const currentIdExists = projects.value.some((project) => project.id === currentProjectId.value)
      const storedIdExists = projects.value.some((project) => project.id === storedProjectId)

      if (currentProjectId.value && currentIdExists) {
        return
      }

      if (storedProjectId && storedIdExists) {
        setCurrentProjectId(storedProjectId)
        return
      }

      setCurrentProjectId(null, { clearStored: Boolean(storedProjectId || currentProjectId.value) })
    } finally {
      loadingProjects.value = false
      projectContextResolved.value = true
    }
  }

  async function initializeAfterAuth(forceReload = false) {
    if (initialized.value && !forceReload) {
      return
    }

    if (!forceReload && initializePromise) {
      await initializePromise
      return
    }

    if (forceReload) {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.list() })
    }

    projectContextResolved.value = false

    initializePromise = (async () => {
      await loadProjects()
      initialized.value = true
    })()

    try {
      await initializePromise
    } finally {
      initializePromise = null
    }
  }

  async function createAndSelectProject(payload: CreateProjectPayload) {
    const created = await createProject(payload)
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all })
    await initializeAfterAuth(true)

    if (created?.id) {
      setCurrentProjectId(created.id, { persist: true })
    }

    return created
  }

  function resetProjectContext(options?: { clearStoredLastProject?: boolean }) {
    const shouldClearStoredLastProject = options?.clearStoredLastProject ?? false

    projects.value = []
    initialized.value = false
    projectContextResolved.value = false
    initializePromise = null

    if (shouldClearStoredLastProject) {
      setCurrentProjectId(null, { clearStored: true })
      return
    }

    currentProjectId.value = null
  }

  return {
    projects,
    currentProjectId,
    loadingProjects,
    initialized,
    projectContextResolved,
    hasProjects,
    currentProject,
    hasCurrentProject,
    getStoredLastProjectId,
    setCurrentProjectId,
    loadProjects,
    initializeAfterAuth,
    createAndSelectProject,
    resetProjectContext,
  }
})
