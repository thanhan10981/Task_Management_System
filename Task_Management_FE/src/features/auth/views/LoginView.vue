<template>
  <div class="auth-card">

    <!-- Header -->
    <div class="auth-header">
      <h2 class="auth-title">Welcome back</h2>
      <p class="auth-subtitle">Sign in to your TaskFlow account</p>
    </div>

    <form @submit="onSubmit" novalidate class="space-y-5">
      <!-- Email -->
      <div>
        <label class="auth-label" for="email">Email address</label>
        <div class="relative">
          <span class="auth-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" class="auth-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </span>
          <input
            id="email"
            v-model="emailValue"
            v-bind="emailAttrs"
            type="email"
            placeholder="you@example.com"
            class="auth-input"
            :class="errors.email ? 'auth-input-invalid' : 'auth-input-valid'"
          />
        </div>
        <p v-if="errors.email" class="auth-field-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="auth-field-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {{ errors.email }}
        </p>
      </div>

      <!-- Password -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="auth-label !mb-0" for="password">Password</label>
          <RouterLink to="/auth/forgot-password" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">
            Forgot password?
          </RouterLink>
        </div>
        <div class="relative">
          <span class="auth-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" class="auth-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input
            id="password"
            v-model="passwordValue"
            v-bind="passwordAttrs"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="auth-input-toggle"
            :class="errors.password ? 'auth-input-invalid' : 'auth-input-valid'"
          />
          <button
            type="button"
            class="auth-toggle-btn"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.378-3.979M6.71 6.71A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.366 2.607M6.71 6.71L3 3m3.71 3.71l10.58 10.58M17.29 17.29L21 21" />
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="auth-field-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="auth-field-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {{ errors.password }}
        </p>
      </div>

      <!-- API Error -->
      <div v-if="apiError" class="auth-api-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ apiError }}
      </div>

      <!-- Submit -->
      <button type="submit" class="auth-btn mt-2" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
          <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Signing in…
        </span>
        <span v-else>Sign In →</span>
      </button>
    </form>

    <!-- Divider & register link -->
    <div class="auth-divider">
      <div class="auth-divider-line" />
      <p class="auth-divider-text">New to TaskFlow?</p>
      <div class="auth-divider-line" />
    </div>
    <RouterLink to="/auth/register" class="auth-secondary-link mt-4">
      Create an account
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApiError } from '@/composables/useApiError'
import { useAuthStore } from '@/stores/auth.store'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useRoute, useRouter } from 'vue-router'
import { useLoginMutation } from '../composables/useAuthMutations'
import { loginSchema } from '../schemas/auth.schema'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { apiError, handleError, clearError } = useApiError()
const loginMutation = useLoginMutation()

const { errors, handleSubmit, isSubmitting, defineField } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const [emailValue, emailAttrs] = defineField('email')
const [passwordValue, passwordAttrs] = defineField('password')
const showPassword = ref(false)

const onSubmit = handleSubmit(async (values) => {
  clearError()
  try {
    const response = await loginMutation.mutateAsync(values)
    authStore.setAuth(null, response.data.user)

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : null
    if (redirectTarget?.startsWith('/')) {
      await router.replace(redirectTarget)
      return
    }

    await router.replace({ name: 'dashboard' })
  } catch (err) {
    handleError(err)
  }
})
</script>
