import type { User } from '@/types/user.types'
import { useProjectStore } from '@/stores/project.store'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(
    localStorage.getItem('auth_user')
      ? (JSON.parse(localStorage.getItem('auth_user') as string) as User)
      : null
  )
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
      projectStore.resetProjectContext()
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
