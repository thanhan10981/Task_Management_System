<template>
  <div class="admin-shell">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="mobileOpen ? 'admin-sidebar--open' : ''">
      <div class="admin-brand">
        <div class="admin-brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="admin-brand-text">
          <strong>OCTOM Admin</strong>
          <small>System Control</small>
        </div>
      </div>

      <nav class="admin-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="admin-nav-link"
          @click="mobileOpen = false"
        >
          <span class="nav-icon" v-html="item.icon" />
          <span class="nav-label">{{ item.label }}</span>
          <span class="nav-indicator" />
        </RouterLink>
      </nav>

      <div class="admin-sidebar-footer">
        <div class="admin-user-avatar">{{ userInitials }}</div>
        <div class="admin-user-info">
          <span class="admin-user-name">{{ authStore.user?.fullName || 'Admin' }}</span>
          <span class="admin-user-role">Administrator</span>
        </div>
        <button type="button" class="admin-logout-btn" title="Logout" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="admin-backdrop" @click="mobileOpen = false" />

    <!-- Main content -->
    <section class="admin-main">
      <header class="admin-header">
        <button class="admin-menu-btn" type="button" aria-label="Open admin menu" @click="mobileOpen = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="admin-header-title">
          <p class="admin-kicker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            System Control Panel
          </p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="admin-header-right">
          <div class="admin-user-pill">
            <div class="admin-user-avatar sm">{{ userInitials }}</div>
            <span>{{ authStore.user?.fullName || 'Admin' }}</span>
          </div>
          <button type="button" class="btn-logout" @click="logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main class="admin-content">
        <RouterView v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileOpen = ref(false)

const navItems = [
  { name: 'admin-dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
  { name: 'admin-users', label: 'Users', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: 'admin-projects', label: 'Projects', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
  { name: 'admin-tasks', label: 'Tasks', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { name: 'admin-members', label: 'Members', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' },
]

const pageTitle = computed(() => String(route.meta.title || 'Admin'))

const userInitials = computed(() => {
  const name = authStore.user?.fullName || authStore.user?.email || 'A'
  return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
})

async function logout() {
  try {
    await post('/auth/logout', {})
  } catch {
    // Continue local logout even if the session is already gone.
  }
  authStore.logout()
  await router.replace({ name: 'admin-login' })
}
</script>

<style scoped>
/* ─── Shell ─────────────────────────────────────────── */
.admin-shell {
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: #f1f5f9;
  color: #172033;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ─── Sidebar ────────────────────────────────────────── */
.admin-sidebar {
  width: 260px;
  height: 100vh;
  flex-shrink: 0;
  background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
  z-index: 90;
  overflow-y: auto;
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─── Brand ──────────────────────────────────────────── */
.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
}
.admin-brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
  flex-shrink: 0;
}
.admin-brand-mark svg { width: 20px; height: 20px; color: #fff; }
.admin-brand-text strong { display: block; font-size: 14px; font-weight: 800; color: #f1f5f9; }
.admin-brand-text small { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }

/* ─── Nav ────────────────────────────────────────────── */
.admin-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}
.admin-nav-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  position: relative;
  transition: all 0.18s ease;
  overflow: hidden;
}
.admin-nav-link:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.07);
}
.admin-nav-link.router-link-active {
  color: #fff;
  background: rgba(99, 102, 241, 0.25);
}
.nav-icon { display: flex; flex-shrink: 0; }
.nav-icon :deep(svg) { width: 18px; height: 18px; }
.nav-label { flex: 1; }
.nav-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  opacity: 0;
  transform: scale(0);
  transition: all 0.18s ease;
}
.admin-nav-link.router-link-active .nav-indicator {
  opacity: 1;
  transform: scale(1);
}

/* ─── Sidebar footer ─────────────────────────────────── */
.admin-sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 8px;
}
.admin-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.admin-user-avatar.sm { width: 30px; height: 30px; font-size: 11px; }
.admin-user-info { flex: 1; min-width: 0; }
.admin-user-name { display: block; font-size: 13px; font-weight: 700; color: #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-user-role { display: block; font-size: 11px; color: #64748b; margin-top: 1px; }
.admin-logout-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
}
.admin-logout-btn:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.35); background: rgba(248, 113, 113, 0.1); }
.admin-logout-btn svg { width: 15px; height: 15px; }

/* ─── Main area ──────────────────────────────────────── */
.admin-main { min-width: 0; flex: 1; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; }

/* ─── Header ─────────────────────────────────────────── */
.admin-header {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.admin-header-title { flex: 1; }
.admin-kicker {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 3px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.admin-kicker svg { width: 11px; height: 11px; }
.admin-header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.btn-logout {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-logout svg { width: 14px; height: 14px; }
.btn-logout:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }

.admin-menu-btn {
  display: none;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}
.admin-menu-btn svg { width: 20px; height: 20px; }

/* ─── Content ────────────────────────────────────────── */
.admin-content { padding: 28px; flex: 1; min-height: 0; }

/* ─── Page transition ────────────────────────────────── */
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(8px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ─── Backdrop ───────────────────────────────────────── */
.admin-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
}

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 768px) {
  .admin-shell { height: auto; min-height: 100vh; overflow: visible; }
  .admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100vh;
    transform: translateX(-100%);
  }
  .admin-main { height: auto; min-height: 100vh; overflow-y: visible; }
  .admin-sidebar--open { transform: translateX(0); }
  .admin-backdrop { display: block; }
  .admin-menu-btn { display: inline-flex; }
  .admin-header { padding: 12px 16px; }
  .admin-user-pill { display: none; }
  .admin-content { padding: 16px; }
}
</style>
