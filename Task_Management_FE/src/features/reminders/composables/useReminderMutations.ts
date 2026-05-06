import { post } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useMutation } from '@tanstack/vue-query'

interface SendTaskReminderInput {
  taskId: string
  thresholdMinutes: number
}

interface SendTaskReminderResponse {
  message: string
  data?: {
    sentCount?: number
    skippedCount?: number
  }
}

export function useSendTaskReminderMutation() {
  return useMutation({
    mutationKey: QUERY_KEYS.reminders.all,
    mutationFn: ({ taskId, thresholdMinutes }: SendTaskReminderInput) =>
      post<SendTaskReminderResponse>(`/reminders/tasks/${taskId}/send`, {
        thresholdMinutes,
      }),
  })
}
