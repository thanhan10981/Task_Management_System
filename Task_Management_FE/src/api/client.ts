import { env } from '@/constants/env'
import { useAuthStore } from '@/stores/auth.store'
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor – attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – handle 401 globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const status = error.response?.status
    if (status === 401) {
      const requestUrl = String(error.config?.url ?? '')
      const isAuthRequest = requestUrl.includes('/auth/')
      const currentPath = window.location.pathname
      const isOnAuthRoute = currentPath.startsWith('/auth/')

      if (isAuthRequest || isOnAuthRoute) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()
      authStore.logout()

      const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const loginPath = currentPath.startsWith('/admin') ? '/admin/login' : '/auth/login'
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectPath)}`
    }

    return Promise.reject(error)
  }
)

export default apiClient

// Generic typed request helpers
export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.get<T>(url, config).then((res) => res.data)

export const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.post<T>(url, data, config).then((res) => res.data)

export const put = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.put<T>(url, data, config).then((res) => res.data)

export const patch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  apiClient.patch<T>(url, data, config).then((res) => res.data)

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  apiClient.delete<T>(url, config).then((res) => res.data)
