<template>
  <span
    ref="triggerRef"
    class="uph"
    :class="[`uph--${placement}`, { 'uph--inline': inline }]"
    @click.stop
    @mouseenter="showCard"
    @mouseleave="hideCard"
    @focusin="showCard"
    @focusout="hideCard"
  >
    <slot>
      <span class="uph-avatar" :style="{ background: profile.color || '#6366f1' }">
        <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="`${profile.name} avatar`">
        <span v-else>{{ profile.initials }}</span>
      </span>
    </slot>

    <Teleport to="body">
      <span
        v-if="isVisible"
        ref="cardRef"
        class="uph-card"
        role="tooltip"
        :style="cardStyle"
      >
        <span class="uph-cover" :style="coverStyle" />
        <span class="uph-avatar-lg" :style="{ background: profile.color || '#6366f1' }">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="`${profile.name} avatar`">
          <span v-else>{{ profile.initials }}</span>
        </span>
        <span class="uph-body">
          <strong class="uph-name">{{ profile.name }}</strong>
          <span v-if="profile.jobTitle" class="uph-job">{{ profile.jobTitle }}</span>
          <span v-if="profile.bio" class="uph-bio">{{ profile.bio }}</span>
          <span class="uph-lines">
            <span v-if="profile.phone" class="uph-line">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6z"/></svg>
              {{ profile.phone }}
            </span>
            <span v-if="profile.email" class="uph-line">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {{ profile.email }}
            </span>
          </span>
          <span v-if="profile.role" class="uph-role">{{ profile.role.toLowerCase() }}</span>
        </span>
      </span>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

export type UserHoverProfile = {
  id?: string
  name: string
  initials: string
  color?: string
  role?: string | null
  email?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  jobTitle?: string | null
  phone?: string | null
  bio?: string | null
}

const props = withDefaults(defineProps<{
  user: UserHoverProfile
  placement?: 'top' | 'bottom' | 'left' | 'right'
  inline?: boolean
}>(), {
  placement: 'top',
  inline: false,
})

const profile = computed(() => ({
  ...props.user,
  name: props.user.name || props.user.email || 'User',
  initials: props.user.initials || props.user.name?.slice(0, 2).toUpperCase() || 'U',
}))

const triggerRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const cardStyle = ref<Record<string, string>>({})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function updateCardPosition() {
  const trigger = triggerRef.value
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  const cardRect = cardRef.value?.getBoundingClientRect()
  const cardWidth = cardRect?.width ?? Math.min(340, window.innerWidth - 24)
  const cardHeight = cardRect?.height ?? 220
  const gap = 10
  const margin = 12

  let top = triggerRect.bottom + gap
  let left = triggerRect.left + triggerRect.width / 2 - cardWidth / 2

  if (props.placement === 'top') {
    top = triggerRect.top - cardHeight - gap
  } else if (props.placement === 'left') {
    top = triggerRect.top + triggerRect.height / 2 - cardHeight / 2
    left = triggerRect.left - cardWidth - gap
  } else if (props.placement === 'right') {
    top = triggerRect.top + triggerRect.height / 2 - cardHeight / 2
    left = triggerRect.right + gap
  }

  cardStyle.value = {
    top: `${clamp(top, margin, window.innerHeight - cardHeight - margin)}px`,
    left: `${clamp(left, margin, window.innerWidth - cardWidth - margin)}px`,
  }
}

async function showCard() {
  isVisible.value = true
  await nextTick()
  updateCardPosition()
}

function hideCard() {
  isVisible.value = false
}

const coverStyle = computed(() => {
  if (profile.value.coverUrl) {
    return {
      backgroundImage: `url(${profile.value.coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return {
    background: `linear-gradient(135deg, ${profile.value.color || '#6366f1'} 0%, #111827 100%)`,
  }
})

function updateVisibleCardPosition() {
  if (isVisible.value) updateCardPosition()
}

onMounted(() => {
  window.addEventListener('resize', updateVisibleCardPosition)
  window.addEventListener('scroll', updateVisibleCardPosition, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCardPosition)
  window.removeEventListener('scroll', updateVisibleCardPosition, true)
})
</script>

<style scoped>
.uph {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.uph--inline {
  vertical-align: middle;
}

.uph-avatar,
.uph-avatar-lg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.uph-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 10px;
}

.uph-avatar img,
.uph-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uph-card {
  position: fixed;
  z-index: 10050;
  width: min(340px, calc(100vw - 24px));
  border: 1.5px solid var(--border-base);
  border-radius: 18px;
  overflow: hidden;
  background: var(--bg-surface);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32), var(--shadow-md);
  pointer-events: none;
  animation: uphCardIn 140ms ease;
}

@keyframes uphCardIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.uph-cover {
  display: block;
  height: 88px;
}

.uph-avatar-lg {
  width: 58px;
  height: 58px;
  margin: -29px 0 0 18px;
  border: 3px solid var(--bg-surface);
  border-radius: 999px;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.26);
  font-size: 17px;
}

.uph-body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 18px 18px;
  text-align: left;
}

.uph-name {
  color: var(--text-heading);
  font-size: 16px;
  line-height: 1.15;
}

.uph-job {
  color: #6366f1;
  font-size: 13px;
  font-weight: 700;
}

.uph-bio {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.uph-lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 2px;
}

.uph-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--text-subtle);
  font-size: 12px;
  line-height: 1.2;
}

.uph-line svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.uph-role {
  align-self: flex-start;
  margin-top: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-active);
  color: #6366f1;
  font-size: 12px;
  font-weight: 800;
}
</style>
