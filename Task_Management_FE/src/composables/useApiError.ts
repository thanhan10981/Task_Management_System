import type { AxiosError } from 'axios'
import { ref } from 'vue'

export function useApiError() {
  const apiError = ref<string | null>(null)

  function handleError(error: unknown) {
    const axiosError = error as AxiosError<{ message: string }>
    apiError.value =
      axiosError.response?.data?.message ?? axiosError.message ?? 'An unexpected error occurred.'
  }

  function clearError() {
    apiError.value = null
  }

  return { apiError, handleError, clearError }
}
