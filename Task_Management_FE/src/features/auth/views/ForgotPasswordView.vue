<template>
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">Forgot your password?</h2>
      <p class="mt-1 text-sm text-slate-400">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <form v-if="!isSent" @submit="onSubmit" novalidate class="space-y-5">
      <div>
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" for="email">
          Email address
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </span>
          <input
            id="email"
            v-model="emailValue"
            v-bind="emailAttrs"
            type="email"
            placeholder="you@example.com"
            class="w-full rounded-xl border bg-white/5 px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="errors.email
              ? 'border-red-500/60 focus:ring-red-500/60 focus:border-red-500/50'
              : 'border-white/10 focus:ring-sky-500/60 focus:border-sky-500/50'"
          />
        </div>
        <p v-if="errors.email" class="mt-1.5 text-xs text-red-400 flex items-center gap-1">{{ errors.email }}</p>
      </div>

      <div v-if="apiError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {{ apiError }}
      </div>

      <button
        type="submit"
        class="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        :disabled="forgotPasswordMutation.isPending.value"
      >
        <span v-if="forgotPasswordMutation.isPending.value">Sending reset link...</span>
        <span v-else>Send reset link</span>
      </button>
    </form>

    <div v-else class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
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
