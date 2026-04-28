import { listUsers } from '@/api/users'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

interface UseUsersQueryOptions {
  enabled?: MaybeRef<boolean>
}

export function useUsersQuery(search: MaybeRef<string> = '', options: UseUsersQueryOptions = {}) {
  const enabled = computed(() => {
    if (typeof options.enabled === 'undefined') {
      return true
    }

    return Boolean(unref(options.enabled))
  })

  return useQuery({
    queryKey: computed(() => QUERY_KEYS.users.list(unref(search).trim())),
    enabled,
    queryFn: () => listUsers(unref(search).trim() || undefined),
  })
}
