import { get } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { User } from '@/types/user.types'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

/** Backend may return { data: User } OR a raw User object depending on NestJS interceptors */
type AuthMeRawResponse = { data: User } | User

function normalizeAuthMeResponse(raw: AuthMeRawResponse): { data: User } {
  if (raw && typeof raw === 'object' && 'data' in raw && typeof (raw as { data: User }).data?.id === 'string') {
    return raw as { data: User }
  }
  // Raw User object without wrapper
  return { data: raw as User }
}

export function useAuthMeQuery(enabled: MaybeRef<boolean> = true) {
  return useQuery({
    queryKey: QUERY_KEYS.auth.me,
    enabled: computed(() => Boolean(unref(enabled))),
    queryFn: async () => {
      const raw = await get<AuthMeRawResponse>('/auth/me')
      return normalizeAuthMeResponse(raw)
    },
  })
}
