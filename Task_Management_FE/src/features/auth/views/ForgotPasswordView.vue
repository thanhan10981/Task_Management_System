<template>
  <div class="auth-card">
    <div class="auth-header">
      <h2 class="auth-title">Forgot your password?</h2>
      <p class="auth-subtitle">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <form v-if="!isSent" @submit="onSubmit" novalidate class="space-y-5">
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
        <p v-if="errors.email" class="auth-field-error">{{ errors.email }}</p>
      </div>

      <div v-if="apiError" class="auth-api-error">
        {{ apiError }}
      </div>

      <button
        type="submit"
        class="auth-btn"
        :disabled="forgotPasswordMutation.isPending.value"
      >
        <span v-if="forgotPasswordMutation.isPending.value">Sending reset link...</span>
        <span v-else>Send reset link</span>
      </button>
    </form>

    <div v-else class="auth-success-banner">
      If your email is registered, a reset link has been sent.
    </div>

    <RouterLink to="/auth/login" class="auth-secondary-link mt-6">
      Back to login
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useApiError } from '@/composables/useApiError'
import { toTypedSchema } from '@vee-validate/zod'
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { useForgotPasswordMutation } from '../composables/useAuthMutations'
import { forgotPasswordSchema } from '../schemas/auth.schema'

const { apiError, handleError, clearError } = useApiError()
const isSent = ref(false)
const forgotPasswordMutation = useForgotPasswordMutation()

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})

const [emailValue, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  clearError()
  try {
    await forgotPasswordMutation.mutateAsync(values)
    isSent.value = true
  } catch (err) {
    handleError(err)
  }
})
</script>
