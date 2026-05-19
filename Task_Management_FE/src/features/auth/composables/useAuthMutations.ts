import { post } from '@/api/client'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { User } from '@/types/user.types'
import { useMutation } from '@tanstack/vue-query'

interface AuthSuccessResponse {
  data: {
    user: User
  }
  message: string
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload extends LoginPayload {
  fullName: string
  confirmPassword: string
}

interface ForgotPasswordPayload {
  email: string
}

interface ResetPasswordPayload {
  resetToken: string
  newPassword: string
  confirmPassword: string
}

interface FirebaseGoogleLoginPayload {
  idToken: string
}

export function useLoginMutation() {
  return useMutation({
    mutationKey: QUERY_KEYS.auth.login,
    mutationFn: (payload: LoginPayload) => post<AuthSuccessResponse>('/auth/login', payload),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationKey: QUERY_KEYS.auth.register,
    mutationFn: (payload: RegisterPayload) => post<AuthSuccessResponse>('/auth/register', payload),
  })
}

export function useFirebaseGoogleLoginMutation() {
  return useMutation({
    mutationKey: ['auth', 'firebase-google-login'],
    mutationFn: (payload: FirebaseGoogleLoginPayload) =>
      post<AuthSuccessResponse>('/auth/firebase/google', payload),
  })
}

export function useFirebaseLoginMutation() {
  return useMutation({
    mutationKey: ['auth', 'firebase-login'],
    mutationFn: (payload: FirebaseGoogleLoginPayload) => post<AuthSuccessResponse>('/auth/firebase', payload),
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationKey: QUERY_KEYS.auth.forgotPassword,
    mutationFn: (payload: ForgotPasswordPayload) => post<{ message: string }>('/auth/forgot-password', payload),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationKey: QUERY_KEYS.auth.resetPassword,
    mutationFn: (payload: ResetPasswordPayload) => post<{ message: string }>('/auth/reset-password', payload),
  })
}
