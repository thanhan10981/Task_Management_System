import type { AxiosError } from 'axios'
import { ref } from 'vue'

export function extractApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.') {
  const axiosError = error as AxiosError<{ message?: string | string[] }>
  const responseMessage = axiosError.response?.data?.message

  if (Array.isArray(responseMessage)) return responseMessage.join(', ')
  if (responseMessage) return responseMessage
  return error instanceof Error ? error.message : fallback
}

export function useApiError() {
  const apiError = ref<string | null>(null)

  function handleError(error: unknown) {
    apiError.value = extractApiErrorMessage(error)
  }

  function clearError() {
    apiError.value = null
  }

  return { apiError, handleError, clearError }
}
