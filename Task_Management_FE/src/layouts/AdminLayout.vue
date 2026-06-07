<template>
  <div class="admin-shell">
    <aside class="admin-sidebar" :class="mobileOpen ? 'admin-sidebar--open' : ''">
      <div class="admin-brand">
        <span class="admin-brand-mark">A</span>
        <div>
          <strong>Admin</strong>
          <small>Task Management</small>
        </div>
      </div>

      <nav class="admin-nav">
        <RouterLink v-for="item in navItems" :key="item.name" :to="{ name: item.name }" class="admin-nav-link" @click="mobileOpen = false">
          <span v-html="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div v-if="mobileOpen" class="admin-backdrop" @click="mobileOpen = false" />

    <section class="admin-main">
      <header class="admin-header">
        <button class="admin-menu-btn" type="button" aria-label="Open admin menu" @click="mobileOpen = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div>
          <p class="admin-kicker">System Control</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="admin-user">
          <span>{{ authStore.user?.fullName || 'Admin' }}</span>
          <button type="button" @click="logout">Logout</button>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
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
.admin-shell {
  min-height: 100vh;
  display: flex;
  background: #f5f7fb;
  color: #172033;
}
.admin-sidebar {
  width: 252px;
  background: #101828;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 18px;
}
.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 20px;
}
.admin-brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
}
.admin-brand strong,
.admin-brand small {
  display: block;
}
.admin-brand small {
  color: #9ca3af;
  margin-top: 2px;
}
.admin-nav {
  display: grid;
  gap: 6px;
}
.admin-nav-link {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 700;
}
.admin-nav-link :deep(svg) {
  width: 18px;
  height: 18px;
}
.admin-nav-link:hover,
.admin-nav-link.router-link-active {
  background: #1f2937;
  color: #fff;
}
.admin-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.admin-header {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.admin-kicker {
  margin: 0 0 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.admin-header h1 {
  margin: 0;
  font-size: 22px;
}
.admin-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}
.admin-user button,
.admin-menu-btn {
  border: 1px solid #dbe3ef;
  background: #fff;
  color: #334155;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
}
.admin-user button {
  padding: 8px 10px;
}
.admin-menu-btn {
  display: none;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
}
.admin-menu-btn svg {
  width: 20px;
  height: 20px;
}
.admin-content {
  padding: 24px;
}
.admin-backdrop {
  display: none;
}
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 80;
    transform: translateX(-100%);
    transition: transform 0.18s ease;
  }
  .admin-sidebar--open {
    transform: translateX(0);
  }
  .admin-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 70;
    background: rgba(15, 23, 42, 0.42);
  }
  .admin-menu-btn {
    display: inline-flex;
  }
  .admin-header {
    padding: 12px;
  }
  .admin-user span {
    display: none;
  }
  .admin-content {
    padding: 14px;
  }
}
</style>
