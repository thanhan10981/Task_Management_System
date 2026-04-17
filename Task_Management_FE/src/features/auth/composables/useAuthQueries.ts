import { get } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { User } from '@/types/user.types'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

interface AuthMeResponse {
  data: User
}

export function useAuthMeQuery(enabled: MaybeRef<boolean> = true) {
  return useQuery({
    queryKey: QUERY_KEYS.auth.me,
    enabled: computed(() => Boolean(unref(enabled))),
    queryFn: () => get<AuthMeResponse>('/auth/me'),
  })
}
