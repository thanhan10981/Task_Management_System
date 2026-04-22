import { z } from 'zod'

export const taskChartPeriodSchema = z.enum(['daily', 'weekly', 'monthly'])

export const taskChartDataSchema = z.object({
  period: taskChartPeriodSchema,
  labels: z.array(z.string()),
  totalSeries: z.array(z.number()),
  completedSeries: z.array(z.number()),
  summary: z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    completionRate: z.number(),
  }),
})

export type TaskChartPeriod = z.infer<typeof taskChartPeriodSchema>
export type TaskChartData = z.infer<typeof taskChartDataSchema>
