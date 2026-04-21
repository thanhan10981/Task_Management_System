<template>
  <div class="auth-card">
    <div class="auth-header">
      <h2 class="auth-title">Set new password</h2>
      <p class="auth-subtitle">Create your new password to continue.</p>
    </div>

    <!-- Token error -->
    <div v-if="tokenError" class="auth-api-error">
      {{ tokenError }}
    </div>

    <form v-else-if="!isSuccess" @submit="onSubmit" novalidate class="space-y-5">
      <!-- New password -->
      <div>
        <label class="auth-label" for="newPassword">New password</label>
        <div class="relative">
          <input
            id="newPassword"
            v-model="newPasswordValue"
            v-bind="newPasswordAttrs"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="auth-input-toggle"
            :class="errors.newPassword ? 'auth-input-invalid' : 'auth-input-valid'"
          />
          <button
            type="button"
            class="auth-toggle-btn"
            :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
            @click="showNewPassword = !showNewPassword"
          >
            <svg v-if="!showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.378-3.979M6.71 6.71A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.366 2.607M6.71 6.71L3 3m3.71 3.71l10.58 10.58M17.29 17.29L21 21" />
            </svg>
          </button>
        </div>
        <p v-if="errors.newPassword" class="auth-field-error">{{ errors.newPassword }}</p>
      </div>

      <!-- Confirm password -->
      <div>
        <label class="auth-label" for="confirmPassword">Confirm new password</label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="confirmPasswordValue"
            v-bind="confirmPasswordAttrs"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="auth-input-toggle"
            :class="errors.confirmPassword ? 'auth-input-invalid' : 'auth-input-valid'"
          />
          <button
            type="button"
            class="auth-toggle-btn"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.378-3.979M6.71 6.71A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.366 2.607M6.71 6.71L3 3m3.71 3.71l10.58 10.58M17.29 17.29L21 21" />
            </svg>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="auth-field-error">{{ errors.confirmPassword }}</p>
      </div>

      <!-- API Error -->
      <div v-if="apiError" class="auth-api-error">
        {{ apiError }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="auth-btn"
        :disabled="resetPasswordMutation.isPending.value"
      >
        <span v-if="resetPasswordMutation.isPending.value">Resetting password...</span>
        <span v-else>Reset password</span>
      </button>
    </form>

    <!-- Success -->
    <div v-else class="auth-success-banner">
      Password has been reset successfully. Please sign in with your new password.
    </div>

    <RouterLink to="/auth/login" class="auth-secondary-link mt-6">
      Go to login
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useApiError } from '@/composables/useApiError'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute } from 'vue-router'
import { useResetPasswordMutation } from '../composables/useAuthMutations'
import { resetPasswordSchema } from '../schemas/auth.schema'

const route = useRoute()
const { apiError, handleError, clearError } = useApiError()
const isSuccess = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const resetPasswordMutation = useResetPasswordMutation()

const resetToken = computed(() => String(route.query.token ?? '').trim())
const tokenError = computed(() =>
  resetToken.value ? null : 'Reset token is missing or invalid. Please request a new reset link.',
)

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(resetPasswordSchema),
})

const [newPasswordValue, newPasswordAttrs] = defineField('newPassword')
const [confirmPasswordValue, confirmPasswordAttrs] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  clearError()
  if (!resetToken.value) return

  try {
    await resetPasswordMutation.mutateAsync({
      resetToken: resetToken.value,
      ...values,
    })
    isSuccess.value = true
  } catch (err) {
    handleError(err)
  }
})
</script>
