import { z } from 'zod'

/**
 * Generic paginated API response schema.
 * Wrap any item schema with this to validate paginated endpoints.
 */
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  })

/**
 * Generic single-item API response schema.
 */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  })

/**
 * Standard error response schema.
 */
export const apiErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.array(z.string())).optional(),
  statusCode: z.number().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
export type ApiResponse<T> = {
  data: T
  message?: string
}
