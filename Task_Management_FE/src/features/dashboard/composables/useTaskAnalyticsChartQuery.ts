import { get } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import { apiResponseSchema } from '@/schemas/api-response.schema'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import {
  taskChartDataSchema,
  type TaskChartPeriod,
} from '../schemas/task-chart.schema'

const taskChartResponseSchema = apiResponseSchema(taskChartDataSchema)

export function useTaskAnalyticsChartQuery(
  period: MaybeRef<TaskChartPeriod>,
  enabled: MaybeRef<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.taskAnalytics.chart(unref(period))),
    enabled: computed(() => Boolean(unref(enabled))),
    queryFn: async () => {
      const response = await get('/task-analytics/chart', {
        params: {
          period: unref(period),
        },
      })

      return taskChartResponseSchema.parse(response)
    },
  })
}
