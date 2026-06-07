<template>
  <main class="admin-login">
    <section class="admin-login-card">
      <p class="admin-login-kicker">Task Management System</p>
      <h1>Admin Login</h1>
      <p class="admin-login-copy">Sign in with an administrator account to manage users, projects, and tasks.</p>

      <form @submit.prevent="submit">
        <label for="admin-email">Email</label>
        <input id="admin-email" v-model.trim="email" type="email" autocomplete="email" required placeholder="admin@vothanhan.dev">

        <label for="admin-password">Password</label>
        <input id="admin-password" v-model="password" type="password" autocomplete="current-password" required placeholder="Password">

        <p v-if="error" class="admin-login-error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in to Admin' }}
        </button>
      </form>

      <RouterLink to="/auth/login">Back to user login</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/user.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(typeof route.query.reason === 'string' ? route.query.reason : '')

function redirectTarget() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect.startsWith('/admin') ? redirect : '/admin/dashboard'
}

async function submit() {
  loading.value = true
  error.value = ''

  try {
    const response = await post<{ data: { user: User } }>('/auth/login', {
      email: email.value,
      password: password.value,
    })
    const user = response.data.user
    if (user.role !== 'ADMIN') {
      authStore.logout()
      error.value = 'This account does not have admin permission.'
      return
    }
    authStore.setAuth(null, user)
    await router.replace(redirectTarget())
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    error.value = message || 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0f172a;
}
.admin-login-card {
  width: min(100%, 420px);
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #111827;
  color: #e5e7eb;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
}
.admin-login-kicker {
  margin: 0 0 8px;
  color: #38bdf8;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: 28px;
}
.admin-login-copy {
  margin: 8px 0 22px;
  color: #94a3b8;
}
form {
  display: grid;
  gap: 10px;
}
label {
  font-size: 12px;
  font-weight: 800;
  color: #cbd5e1;
}
input {
  height: 44px;
  border: 1px solid #334155;
  background: #0b1120;
  color: #f8fafc;
  border-radius: 8px;
  padding: 0 12px;
  outline: none;
}
input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
}
button {
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  margin-top: 6px;
}
button:disabled {
  opacity: 0.7;
  cursor: wait;
}
.admin-login-error {
  margin: 2px 0;
  color: #fca5a5;
  font-size: 13px;
}
a {
  display: inline-block;
  margin-top: 18px;
  color: #93c5fd;
  font-weight: 800;
  text-decoration: none;
}
</style>
