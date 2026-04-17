import { get, patch } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/user.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

export interface UserSettingsApiData {
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM' | null
  notificationSettings?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
}

interface UserSettingsResponse {
  data: UserSettingsApiData
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
    preferences: {
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
  return useQuery({
    queryKey: QUERY_KEYS.userSettings.me(),
    queryFn: () => get<UserSettingsResponse>('/user-settings/me'),
  })
}

export function useSaveUserSettingsMutation() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  return useMutation({
    mutationKey: [...QUERY_KEYS.userSettings.me(), 'save'] as const,
    mutationFn: async (payload: SaveUserSettingsPayload) => {
      let updatedUser: User | null = authStore.user

      if (payload.userId) {
        updatedUser = await patch<User>(`/users/${payload.userId}`, payload.userProfile)
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
