<template>
  <div class="min-h-screen flex bg-secondary-50">
    <!-- Sidebar placeholder -->
    <aside class="w-64 bg-white border-r border-secondary-200 flex-shrink-0">
      <div class="p-6 border-b border-secondary-200">
        <h1 class="text-xl font-bold text-primary-700">Task Manager</h1>
      </div>
      <nav class="p-4 space-y-1">
        <RouterLink
          to="/"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary-700
            hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
          active-class="bg-primary-50 text-primary-700 font-medium"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/tasks"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary-700
            hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
          active-class="bg-primary-50 text-primary-700 font-medium"
        >
          Tasks
        </RouterLink>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-secondary-200 flex items-center justify-end px-6">
        <button class="btn-outline text-sm" @click="handleLogout">Logout</button>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>
