<template>
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">Set new password</h2>
      <p class="mt-1 text-sm text-slate-400">Create your new password to continue.</p>
    </div>

    <!-- Token error -->
    <div v-if="tokenError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {{ tokenError }}
    </div>

    <form v-else-if="!isSuccess" @submit="onSubmit" novalidate class="space-y-5">
      <!-- New password -->
      <div>
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" for="newPassword">New password</label>
        <div class="relative">
          <input
            id="newPassword"
            v-model="newPasswordValue"
            v-bind="newPasswordAttrs"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="w-full rounded-xl border bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="errors.newPassword
              ? 'border-red-500/60 focus:ring-red-500/60 focus:border-red-500/50'
              : 'border-white/10 focus:ring-sky-500/60 focus:border-sky-500/50'"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
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
        <p v-if="errors.newPassword" class="mt-1.5 text-xs text-red-400">{{ errors.newPassword }}</p>
      </div>

      <!-- Confirm password -->
      <div>
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" for="confirmPassword">Confirm new password</label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="confirmPasswordValue"
            v-bind="confirmPasswordAttrs"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="w-full rounded-xl border bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="errors.confirmPassword
              ? 'border-red-500/60 focus:ring-red-500/60 focus:border-red-500/50'
              : 'border-white/10 focus:ring-sky-500/60 focus:border-sky-500/50'"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
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
        <p v-if="errors.confirmPassword" class="mt-1.5 text-xs text-red-400">{{ errors.confirmPassword }}</p>
      </div>

      <!-- API Error -->
      <div v-if="apiError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {{ apiError }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        :disabled="resetPasswordMutation.isPending.value"
      >
        <span v-if="resetPasswordMutation.isPending.value">Resetting password...</span>
        <span v-else>Reset password</span>
      </button>
    </form>

    <!-- Success -->
    <div v-else class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
      Password has been reset successfully. Please sign in with your new password.
    </div>

    <RouterLink
      to="/auth/login"
      class="mt-6 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 font-medium hover:bg-white/10 hover:text-white transition-all duration-200"
    >
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
