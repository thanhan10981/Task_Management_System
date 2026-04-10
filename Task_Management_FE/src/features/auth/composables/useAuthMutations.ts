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
