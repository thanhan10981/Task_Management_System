const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:3001/api'

export const env = {
  VITE_API_BASE_URL: apiBaseUrl,
  VITE_APP_NAME: (import.meta.env.VITE_APP_NAME as string) ?? 'Task Management System',
  VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string,
  VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string,
  VITE_CLOUDINARY_UPLOAD_URL: (import.meta.env.VITE_CLOUDINARY_UPLOAD_URL as string) ?? 'https://api.cloudinary.com/v1_1',
  VITE_FIREBASE_API_KEY:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? 'AIzaSyAqTy1srGXjYCdvriVpIcoIYs91g0eNG5U',
  VITE_FIREBASE_AUTH_DOMAIN:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? 'task-management-system-gg.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'task-management-system-gg',
  VITE_FIREBASE_STORAGE_BUCKET:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? 'task-management-system-gg.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '64902253893',
  VITE_FIREBASE_APP_ID:
    (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? '1:64902253893:web:cfbf216fe3521e2130022c',
  VITE_FIREBASE_MEASUREMENT_ID:
    (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? 'G-CXM80HJJTG',
} as const
