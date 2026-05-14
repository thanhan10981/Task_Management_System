import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/api/notifications'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

interface NotificationListParams {
  page?: number
  limit?: number
  type?: string
}

export function useNotificationsQuery(
  params: MaybeRef<NotificationListParams>,
  options?: { enabled?: MaybeRef<boolean>; refetchInterval?: MaybeRef<number | false> },
) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.notifications.list({ ...unref(params) })),
    enabled: computed(() => Boolean(unref(options?.enabled ?? true))),
    refetchInterval: computed(() => unref(options?.refetchInterval ?? false)),
    queryFn: () => listNotifications(unref(params)),
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.all })
      const previous = queryClient.getQueriesData<NotificationItem[]>({ queryKey: QUERY_KEYS.notifications.all })

      for (const [queryKey, notifications] of previous) {
        if (!notifications) continue
        queryClient.setQueryData(
          queryKey,
          notifications.map((note) => (note.id === id ? { ...note, isRead: true } : note)),
        )
      }

      return { previous }
    },
    onError: (_error, _id, context) => {
      for (const [queryKey, notifications] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, notifications)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all }),
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.all })
      const previous = queryClient.getQueriesData<NotificationItem[]>({ queryKey: QUERY_KEYS.notifications.all })

      for (const [queryKey, notifications] of previous) {
        if (!notifications) continue
        queryClient.setQueryData(
          queryKey,
          notifications.map((note) => ({ ...note, isRead: true })),
        )
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, notifications] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, notifications)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all }),
  })
}
