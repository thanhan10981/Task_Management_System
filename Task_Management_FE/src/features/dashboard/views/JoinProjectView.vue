<template>
  <section class="jp-shell">
    <div class="jp-card">
      <div class="jp-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 3l1.7 4.5L18 9.2l-4.3 1.7L12 16l-1.7-5.1L6 9.2l4.3-1.7L12 3z"/></svg>
      </div>
      <div class="jp-content">
        <h1 class="jp-title">Joining project</h1>
        <p class="jp-subtitle" v-if="!errorMessage">
          Please wait while we add you to the project.
        </p>
        <p class="jp-subtitle jp-error" v-else>
          {{ errorMessage }}
        </p>
        <div class="jp-actions">
          <div v-if="!errorMessage" class="jp-loader" aria-label="Loading" />
          <button
            v-else
            type="button"
            class="jp-btn"
            @click="router.push({ name: 'dashboard' })"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { joinProject } from '@/api/projects'
import { useToast } from '@/composables/useToast'
import { INVITE_TOKEN_QUERY_KEY } from '@/features/projects/constants/invite.constants'
import { useProjectStore } from '@/stores/project.store'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const projectStore = useProjectStore()
const errorMessage = ref('')

const projectId = computed(() =>
  typeof route.params.projectId === 'string' ? route.params.projectId : null
)
const inviteToken = computed(() =>
  typeof route.query[INVITE_TOKEN_QUERY_KEY] === 'string'
    ? (route.query[INVITE_TOKEN_QUERY_KEY] as string)
    : ''
)

onMounted(async () => {
  if (!projectId.value) {
    errorMessage.value = 'Invalid invite link.'
    return
  }

  if (!inviteToken.value) {
    errorMessage.value = 'Invite token is missing.'
    return
  }

  try {
    await joinProject(projectId.value, inviteToken.value)
    await projectStore.initializeAfterAuth(true)
    projectStore.setCurrentProjectId(projectId.value, { persist: true })
    router.replace({ name: 'project-board', params: { projectId: projectId.value } })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to join this project.'
    toast.error(errorMessage.value)
  }
})
</script>

<style scoped>
.jp-shell {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-app);
}

.jp-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px 24px;
  border-radius: 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border-base);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  max-width: 520px;
  width: 100%;
}

.jp-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
  color: #6366f1;
  flex-shrink: 0;
}

.jp-content {
  flex: 1;
  min-width: 0;
}

.jp-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text-heading);
}

.jp-subtitle {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--text-muted);
}

.jp-error {
  color: #ef4444;
}

.jp-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.jp-loader {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  animation: jpSpin 0.8s linear infinite;
}

.jp-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.jp-btn:hover {
  opacity: 0.9;
}

@keyframes jpSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
