<template>
  <div class="auth-card p-8">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">Forgot your password?</h2>
      <p class="mt-1 text-sm text-slate-400">
        Enter your email address and we’ll send you a link to reset your password.
      </p>
    </div>

    <form v-if="!isSent" @submit="onSubmit" novalidate class="space-y-5">
      <div>
        <label class="auth-label" for="email">Email address</label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          </span>
          <input
            id="email"
            v-model="emailValue"
            v-bind="emailAttrs"
            type="email"
            placeholder="you@example.com"
            :class="['auth-input pl-10', errors.email ? 'auth-input-error' : '']"
          />
        </div>
        <p v-if="errors.email" class="auth-error">{{ errors.email }}</p>
      </div>

      <div
        v-if="apiError"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      >
        {{ apiError }}
      </div>

      <button type="submit" class="auth-btn" :disabled="isSubmitting">
        <span v-if="isSubmitting">Sending reset link...</span>
        <span v-else>Send reset link</span>
      </button>
    </form>

    <div
      v-else
      class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300"
    >
      If your email is registered, a reset link has been sent.
    </div>

    <RouterLink
      to="/auth/login"
      class="mt-6 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 font-medium hover:bg-white/10 hover:text-white transition-all duration-200"
    >
      Back to login
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { post } from '@/api/client'
import { useApiError } from '@/composables/useApiError'
import { toTypedSchema } from '@vee-validate/zod'
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { forgotPasswordSchema } from '../schemas/auth.schema'

const { apiError, handleError, clearError } = useApiError()
const isSent = ref(false)

const { errors, handleSubmit, isSubmitting, defineField } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})

const [emailValue, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  clearError()
  try {
    await post<{ message: string }>('/auth/forgot-password', values)
    isSent.value = true
  } catch (err) {
    handleError(err)
  }
})
</script>