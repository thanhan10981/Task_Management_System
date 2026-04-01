export const env = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  VITE_APP_NAME: (import.meta.env.VITE_APP_NAME as string) ?? 'Task Management System',
} as const
