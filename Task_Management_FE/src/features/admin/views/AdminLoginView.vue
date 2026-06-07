<template>
  <main class="admin-login">
    <!-- Background decoration -->
    <div class="login-bg">
      <div class="login-bg-orb login-bg-orb--1"></div>
      <div class="login-bg-orb login-bg-orb--2"></div>
    </div>

    <section class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="login-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <p class="login-kicker">Task Management System</p>
          <h1>Admin Panel</h1>
        </div>
      </div>

      <p class="login-copy">Sign in with an administrator account to access the control panel.</p>

      <form @submit.prevent="submit" class="login-form">
        <div class="field-group">
          <label for="admin-email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            Email address
          </label>
          <div class="input-wrap">
            <input
              id="admin-email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              required
              placeholder="admin@example.com"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="field-group">
          <label for="admin-password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Password
          </label>
          <div class="input-wrap">
            <input
              id="admin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="Enter your password"
              :disabled="loading"
            />
            <button type="button" class="toggle-pw" @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <Transition name="err-fade">
          <div v-if="error" class="login-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner" />
          <span v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </span>
          {{ loading ? 'Signing in...' : 'Sign in to Admin' }}
        </button>
      </form>

      <div class="login-footer">
        <RouterLink to="/auth/login" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to user login
        </RouterLink>
      </div>
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
const showPassword = ref(false)
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
    error.value = message || 'Unable to sign in. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ─── Background ─────────────────────────────────────── */
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #080f1e;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.login-bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
}
.login-bg-orb--1 {
  width: 500px; height: 500px;
  top: -140px; left: -140px;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
}
.login-bg-orb--2 {
  width: 400px; height: 400px;
  bottom: -100px; right: -100px;
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
}

/* ─── Card ───────────────────────────────────────────── */
.login-card {
  width: min(100%, 440px);
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;
}

/* ─── Logo ───────────────────────────────────────────── */
.login-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.login-logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}
.login-logo-icon svg { width: 22px; height: 22px; color: #fff; }
.login-kicker {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6366f1;
}
h1 { margin: 0; font-size: 24px; font-weight: 800; color: #f1f5f9; }
.login-copy { margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.5; }

/* ─── Form ───────────────────────────────────────────── */
.login-form { display: grid; gap: 16px; }
.field-group { display: grid; gap: 7px; }
label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
label svg { width: 12px; height: 12px; }
.input-wrap { position: relative; }
input {
  width: 100%;
  height: 46px;
  padding: 0 42px 0 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-sizing: border-box;
}
input::placeholder { color: #475569; }
input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}
input:disabled { opacity: 0.5; cursor: not-allowed; }

.toggle-pw {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  transition: color 0.15s ease;
}
.toggle-pw:hover { color: #94a3b8; }
.toggle-pw svg { width: 16px; height: 16px; }

/* ─── Error ──────────────────────────────────────────── */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 13px;
  font-weight: 600;
}
.login-error svg { width: 15px; height: 15px; flex-shrink: 0; }
.err-fade-enter-active, .err-fade-leave-active { transition: all 0.2s ease; }
.err-fade-enter-from, .err-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ─── Submit button ──────────────────────────────────── */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}
.login-btn svg { width: 16px; height: 16px; }
.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55);
}
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.login-spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Footer ─────────────────────────────────────────── */
.login-footer { margin-top: 24px; text-align: center; }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6366f1;
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.15s ease;
}
.back-link:hover { color: #818cf8; }
.back-link svg { width: 14px; height: 14px; }
</style>
