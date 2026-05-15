import type { User } from '@/types/user.types'
import { QUERY_KEYS } from '@/constants/query-keys'
import { queryClient } from '@/lib/query-client'
import { useProjectStore } from '@/stores/project.store'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

function readStoredUser(): User | null {
  const rawUser = localStorage.getItem('auth_user')
  if (!rawUser) return null

  try {
    const parsedUser = JSON.parse(rawUser) as Partial<User>
    if (typeof parsedUser.id === 'string') {
      return parsedUser as User
    }

    localStorage.removeItem('auth_user')
    return null
  } catch {
    localStorage.removeItem('auth_user')
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(readStoredUser())
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))

  const isAuthenticated = computed(() => !!user.value || !!accessToken.value)

  function setAuth(token: string | null, userData: User) {
    accessToken.value = token
    user.value = userData
    localStorage.setItem('auth_user', JSON.stringify(userData))

    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')

    try {
      const projectStore = useProjectStore()
      projectStore.resetProjectContext({ clearStoredLastProject: true })
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projects.all })
    } catch {
      // Ignore reset errors when pinia is not available yet.
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    setAuth,
    logout,
  }
})
