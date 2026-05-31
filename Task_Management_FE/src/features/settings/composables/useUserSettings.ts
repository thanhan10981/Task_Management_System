import { get, patch } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/user.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

export interface UserSettingsApiData {
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM' | null
  notificationSettings?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
}

interface ApiEnvelope<T> {
  data?: T
}

export interface SaveUserSettingsPayload {
  userId?: string
  userProfile: {
    fullName: string
    avatarUrl: string
    coverUrl: string
    jobTitle: string
    phone: string
    bio: string
    password?: string
  }
  settings: {
    theme: 'LIGHT' | 'DARK' | 'SYSTEM'
    notificationSettings: Record<string, boolean>
    preferences: Record<string, unknown> & {
      profile: {
        firstName: string
        lastName: string
        jobTitle: string
        phone: string
        bio: string
        avatarUrl: string
        coverUrl: string
      }
    }
  }
}

export function useUserSettingsQuery() {
  const authStore = useAuthStore()

  return useQuery({
    queryKey: computed(() => [...QUERY_KEYS.userSettings.me(), authStore.user?.id ?? 'anonymous'] as const),
    enabled: computed(() => authStore.isAuthenticated),
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await get<UserSettingsApiData | ApiEnvelope<UserSettingsApiData>>('/user-settings/me')
      return unwrapApiPayload(response)
    },
  })
}

function unwrapApiPayload<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T
  }

  return response as T
}

export function useSaveUserSettingsMutation() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  return useMutation({
    mutationKey: [...QUERY_KEYS.userSettings.me(), 'save'] as const,
    mutationFn: async (payload: SaveUserSettingsPayload) => {
      let updatedUser: User | null = authStore.user

      if (payload.userId) {
        const response = await patch<User | ApiEnvelope<User>>(`/users/${payload.userId}`, payload.userProfile)
        updatedUser = unwrapApiPayload(response)
      }

      await patch('/user-settings/me', payload.settings)

      return {
        updatedUser,
      }
    },
    onSuccess: async ({ updatedUser }) => {
      if (updatedUser) {
        authStore.setAuth(authStore.accessToken, updatedUser)
        queryClient.setQueryData(QUERY_KEYS.auth.me, { data: updatedUser })
        queryClient.setQueryData(QUERY_KEYS.users.detail(updatedUser.id), updatedUser)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.me }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSettings.all }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all }),
      ])
    },
  })
}
