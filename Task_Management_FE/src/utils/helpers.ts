/**
 * Format a date string to a human-readable format.
 */
export function formatDate(date: string | null | undefined, locale = 'en-US'): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Truncate a string to a max length and add ellipsis.
 */
export function truncate(str: string, maxLength = 100): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}…`
}

/**
 * Safely parse an API response with a Zod schema.
 * Returns null if parsing fails (logs to console in dev).
 */
import type { ZodError, ZodType } from 'zod'
export function safeParseApiResponse<T>(schema: ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn('[Zod] API response validation failed:', (result.error as ZodError).errors)
    }
    return null
  }
  return result.data
}
