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
  const currentProjectId = ref<string | null>(
    localStorage.getItem(LAST_PROJECT_STORAGE_KEY) || localStorage.getItem(LEGACY_PROJECT_STORAGE_KEY),
  )
  const loadingProjects = ref(false)
  const initialized = ref(false)

  const hasProjects = computed(() => projects.value.length > 0)
  const currentProject = computed(() =>
    projects.value.find((project) => project.id === currentProjectId.value) ?? null,
  )
  const hasCurrentProject = computed(() => Boolean(currentProject.value))

  function setCurrentProjectId(projectId: string | null) {
    currentProjectId.value = projectId
    if (projectId) {
      localStorage.setItem(LAST_PROJECT_STORAGE_KEY, projectId)
      localStorage.setItem(LEGACY_PROJECT_STORAGE_KEY, projectId)
      return
    }

    localStorage.removeItem(LAST_PROJECT_STORAGE_KEY)
    localStorage.removeItem(LEGACY_PROJECT_STORAGE_KEY)
  }

  function ensureCurrentProjectSelection() {
    if (!projects.value.length) {
      setCurrentProjectId(null)
      return
    }

    const currentStillExists = projects.value.some((project) => project.id === currentProjectId.value)
    if (!currentStillExists) {
      setCurrentProjectId(null)
    }
  }

  async function loadProjects() {
    loadingProjects.value = true
    try {
      projects.value = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.projects.list(),
        queryFn: () => listUserProjects(),
      })
      ensureCurrentProjectSelection()
    } finally {
      loadingProjects.value = false
    }
  }

  async function initializeAfterAuth(forceReload = false) {
    if (initialized.value && !forceReload) {
      return
    }

    await loadProjects()
    initialized.value = true
  }

  async function createAndSelectProject(payload: CreateProjectPayload) {
    const created = await createProject(payload)
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all })
    await initializeAfterAuth(true)

    if (created?.id) {
      setCurrentProjectId(created.id)
    }

    return created
  }

  function resetProjectContext() {
    projects.value = []
    initialized.value = false
    setCurrentProjectId(null)
  }

  return {
    projects,
    currentProjectId,
    loadingProjects,
    initialized,
    hasProjects,
    currentProject,
    hasCurrentProject,
    setCurrentProjectId,
    loadProjects,
    initializeAfterAuth,
    createAndSelectProject,
    resetProjectContext,
  }
})
