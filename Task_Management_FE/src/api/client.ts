import { env } from '@/constants/env'
import { useAuthStore } from '@/stores/auth.store'
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

function isFilesApiRequest(url?: string): boolean {
  if (!url) return false
  return url.includes('/files/cloudinary') || url.includes('/files/') || url.endsWith('/files')
}

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
    if (isFilesApiRequest(config.url)) {
      console.log('[API][Request]', {
        method: config.method,
        baseURL: config.baseURL,
        url: config.url,
        params: config.params,
      })
    }

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
    if (isFilesApiRequest(response.config?.url)) {
      console.log('[API][Response]', {
        status: response.status,
        url: response.config?.url,
        data: response.data,
      })
    }
    return response
  },
  async (error) => {
    const status = error.response?.status
    const requestUrl = error?.config?.url as string | undefined

    if (isFilesApiRequest(requestUrl)) {
      console.error('[API][Error]', {
        status,
        url: requestUrl,
        message: error?.message,
        data: error?.response?.data,
      })
    }

    if (status === 401) {
      const authStore = useAuthStore()
      authStore.logout()

      const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const isOnAuthRoute = redirectPath.startsWith('/auth/')

      if (isOnAuthRoute) {
        window.location.href = '/auth/login'
      } else {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`
      }
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
