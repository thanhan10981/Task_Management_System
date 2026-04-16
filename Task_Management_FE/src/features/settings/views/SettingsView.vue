<template>
  <div class="sp-root">
    <div class="sp-cover" :style="coverStyle">
      <label class="sp-cover-upload" title="Change cover">
        <input type="file" accept="image/*" hidden @change="onCoverChange">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Change cover
      </label>
    </div>
    <div class="sp-page-header">
      <!-- Avatar -->
      <label class="sp-avatar-wrap" title="Change photo">
        <input type="file" accept="image/*" hidden @change="onAvatarChange">
        <div class="sp-avatar">
          <img v-if="preview.avatarUrl" :src="preview.avatarUrl" alt="avatar" class="sp-avatar-img">
          <span v-else class="sp-avatar-initials">{{ initials }}</span>
        </div>
        <div class="sp-avatar-overlay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
          </svg>
        </div>
      </label>

      <div class="sp-page-title-block">
        <h2 class="sp-page-title">Profile Settings</h2>
        <p class="sp-page-subtitle">{{ preview.fullName || 'Your Name' }} · {{ preview.jobTitle || 'Your role' }}</p>
      </div>

      <div class="sp-header-actions">
        <button class="btn-secondary" :disabled="!isDirty || saving" @click="handleCancel">Cancel</button>
        <button class="btn-primary" :disabled="!isDirty || saving" @click="handleSave">
          <span v-if="saving" class="btn-spinner" />
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <nav class="sp-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="sp-tab"
        :class="{ 'sp-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </nav>

    <div class="sp-layout">
      <div class="sp-form-col">
        <template v-if="activeTab === 'my-details'">
          <section class="sp-section">
            <h3 class="sp-section-title">Personal information</h3>
            <p class="sp-section-desc">Update your photo and personal details.</p>

            <!-- Full name -->
            <div class="form-row two-col">
              <div class="form-group">
                <label class="form-label" for="firstName">First name</label>
                <input id="firstName" v-model="form.firstName" class="form-input" type="text" placeholder="John">
              </div>
              <div class="form-group">
                <label class="form-label" for="lastName">Last name</label>
                <input id="lastName" v-model="form.lastName" class="form-input" type="text" placeholder="Doe">
              </div>
            </div>

            <!-- Email (readonly) -->
            <div class="form-group">
              <label class="form-label" for="email">
                Email address
                <span class="badge-readonly">read-only</span>
              </label>
              <div class="input-icon-wrap">
                <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input id="email" :value="form.email" class="form-input has-icon" type="email" disabled>
              </div>
            </div>

            <!-- Job title + Phone -->
            <div class="form-row two-col">
              <div class="form-group">
                <label class="form-label" for="jobTitle">Job title</label>
                <input id="jobTitle" v-model="form.jobTitle" class="form-input" type="text" placeholder="Product Designer">
              </div>
              <div class="form-group">
                <label class="form-label" for="phone">Phone</label>
                <div class="input-icon-wrap">
                  <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-1.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <input id="phone" v-model="form.phone" class="form-input has-icon" type="tel" placeholder="+1 234 567 8900">
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div class="form-group">
              <label class="form-label" for="bio">
                Bio
                <span class="char-count" :class="{ 'char-count--warn': form.bio.length > 180 }">
                  {{ form.bio.length }}/200
                </span>
              </label>
              <textarea
                id="bio"
                v-model="form.bio"
                class="form-input form-textarea"
                rows="4"
                maxlength="200"
                placeholder="Tell your team a little about yourself…"
              />
            </div>
          </section>
        </template>
        <template v-else-if="activeTab === 'preferences'">
          <section class="sp-section">
            <h3 class="sp-section-title">App preferences</h3>
            <p class="sp-section-desc">Customize your theme.</p>

            <!-- Theme -->
            <div class="form-group">
              <label class="form-label">Theme</label>
              <div class="theme-toggle">
                <button
                  v-for="t in themes"
                  :key="t.value"
                  class="theme-btn"
                  :class="{ 'theme-btn--active': settings.theme === t.value }"
                  @click="applyTheme(t.value)"
                >
                  <span v-html="t.icon" />
                  {{ t.label }}
                </button>
              </div>
            </div>
          </section>
        </template>

        <!-- â”€â”€ PASSWORD â”€â”€ -->
        <template v-else-if="activeTab === 'password'">
          <section class="sp-section">
            <h3 class="sp-section-title">Change password</h3>
            <p class="sp-section-desc">Use a strong password you don't use elsewhere.</p>

            <div class="form-group">
              <label class="form-label" for="currentPw">Current password</label>
              <input id="currentPw" v-model="pwForm.current" class="form-input" type="password" placeholder="••••••••">
            </div>
            <div class="form-row two-col">
              <div class="form-group">
                <label class="form-label" for="newPw">New password</label>
                <input id="newPw" v-model="pwForm.newPw" class="form-input" type="password" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label class="form-label" for="confirmPw">Confirm new password</label>
                <input id="confirmPw" v-model="pwForm.confirm" class="form-input" :class="{ 'form-input--error': pwMismatch }" type="password" placeholder="••••••••">
              </div>
            </div>
            <p v-if="pwMismatch" class="form-error">Passwords do not match.</p>

            <div class="pw-strength" v-if="pwForm.newPw.length > 0">
              <span class="pw-strength-label">Strength:</span>
              <div class="pw-bars">
                <div v-for="i in 4" :key="i" class="pw-bar" :class="pwStrengthClass(i)" />
              </div>
              <span class="pw-strength-text">{{ pwStrengthLabel }}</span>
            </div>
          </section>
        </template>

        <!-- â”€â”€ NOTIFICATIONS â”€â”€ -->
        <template v-else-if="activeTab === 'notifications'">
          <section class="sp-section">
            <h3 class="sp-section-title">Notification preferences</h3>
            <p class="sp-section-desc">Choose what you want to be notified about.</p>
            <div class="notif-list">
              <div v-for="n in notifications" :key="n.id" class="notif-row">
                <div class="notif-info">
                  <span class="notif-title">{{ n.title }}</span>
                  <span class="notif-desc">{{ n.desc }}</span>
                </div>
                <label class="toggle">
                  <input v-model="n.enabled" type="checkbox" class="toggle-input">
                  <span class="toggle-track"><span class="toggle-thumb" /></span>
                </label>
              </div>
            </div>
          </section>
        </template>

      </div><!-- /sp-form-col -->

      <!-- â•â• RIGHT: Live Preview â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <aside class="sp-preview-col">
        <div class="preview-sticky">
          <p class="preview-label">Live preview</p>
          <div class="preview-card">
            <!-- Mini cover -->
            <div class="preview-cover" :style="coverStyle" />

            <!-- Avatar -->
            <div class="preview-avatar-wrap">
              <div class="preview-avatar">
                <img v-if="preview.avatarUrl" :src="preview.avatarUrl" alt="avatar" class="preview-avatar-img">
                <span v-else class="preview-avatar-initials">{{ initials }}</span>
              </div>
            </div>

            <!-- Info -->
            <div class="preview-body">
              <h4 class="preview-name">{{ preview.fullName || 'Your Name' }}</h4>
              <p class="preview-job">{{ preview.jobTitle || 'Job title' }}</p>

              <p v-if="preview.bio" class="preview-bio">{{ preview.bio }}</p>

              <div class="preview-contacts">
                <div v-if="preview.phone" class="preview-contact-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6z"/>
                  </svg>
                  {{ preview.phone }}
                </div>
                <div v-if="preview.email" class="preview-contact-row">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  {{ preview.email }}
                </div>
              </div>

              <!-- Theme badge -->
              <div class="preview-theme-badge">
                <span>{{ themeBadgeIcon }} {{ settings.theme }} theme</span>
              </div>
            </div>
          </div>

          <!-- Tip -->
          <p class="preview-tip">Changes appear here as you type.</p>
        </div>
      </aside>

    </div><!-- /sp-layout -->

    <!-- â”€â”€ Save success toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <Transition name="toast">
      <div v-if="saveSuccess" class="save-toast">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        Profile saved successfully!
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { get, patch } from '@/api/client'
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import type { User } from '@/types/user.types'

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  phone: string
  bio: string
  avatarUrl: string
  coverUrl: string
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
}

interface PasswordForm {
  current: string
  newPw: string
  confirm: string
}

interface ProfilePreview extends ProfileForm {
  fullName: string
}

interface Notification {
  id: string
  title: string
  desc: string
  enabled: boolean
}

interface ThemeOption {
  value: UserSettings['theme']
  label: string
  icon: string
}

interface SettingsSnapshot {
  form: ProfileForm
  settings: UserSettings
  pwForm: PasswordForm
  notifications: Array<{ id: string; enabled: boolean }>
}

interface UserSettingsApiData {
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM' | null
  notificationSettings?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
}

const authStore = useAuthStore()
const { themeMode, setTheme } = useTheme()

const DUMMY: ProfileForm = {
  firstName: authStore.user?.fullName?.split(' ')[0] ?? 'Alex',
  lastName: authStore.user?.fullName?.split(' ').slice(1).join(' ') ?? 'Johnson',
  email: authStore.user?.email ?? 'alex.johnson@example.com',
  jobTitle: authStore.user?.jobTitle ?? 'Product Designer',
  phone: authStore.user?.phone ?? '+1 234 567 8900',
  bio: authStore.user?.bio ?? 'Passionate product designer with 5+ years of experience crafting intuitive user experiences.',
  avatarUrl: authStore.user?.avatarUrl ?? '',
  coverUrl: authStore.user?.coverUrl ?? '',
}

const form = reactive<ProfileForm>({ ...DUMMY })
const settings = reactive<UserSettings>({ theme: themeMode.value })
const pwForm = reactive<PasswordForm>({ current: '', newPw: '', confirm: '' })

const tabs = [
  { id: 'my-details', label: 'My details' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'password', label: 'Password' },
  { id: 'notifications', label: 'Notifications' },
] as const

type TabId = typeof tabs[number]['id']
const activeTab = ref<TabId>('my-details')

const themes: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  },
  {
    value: 'system',
    label: 'System',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  },
]

const notifications = reactive<Notification[]>([
  { id: 'task-assign', title: 'Task assigned to you', desc: 'When a task is assigned to you.', enabled: true },
  { id: 'comments', title: 'Comments', desc: 'When someone replies to your comments.', enabled: true },
  { id: 'reminders', title: 'Reminders', desc: 'Upcoming task deadline reminders.', enabled: false },
  { id: 'team-update', title: 'Team activity', desc: "Updates about your teammates' work.", enabled: false },
  { id: 'project', title: 'Project milestones', desc: 'When a project milestone is reached.', enabled: true },
  { id: 'mentions', title: 'Mentions', desc: 'When someone mentions you in a comment.', enabled: true },
])

function buildSnapshot(): SettingsSnapshot {
  return {
    form: { ...form },
    settings: { ...settings },
    pwForm: { ...pwForm },
    notifications: notifications.map((n) => ({ id: n.id, enabled: n.enabled })),
  }
}

const originalSnapshot = ref<SettingsSnapshot>(buildSnapshot())
const isDirty = computed(() => JSON.stringify(buildSnapshot()) !== JSON.stringify(originalSnapshot.value))

const preview = reactive<ProfilePreview>({
  ...DUMMY,
  fullName: `${DUMMY.firstName} ${DUMMY.lastName}`.trim(),
})

watch(
  form,
  (v) => {
    preview.firstName = v.firstName
    preview.lastName = v.lastName
    preview.fullName = `${v.firstName} ${v.lastName}`.trim()
    preview.email = v.email
    preview.jobTitle = v.jobTitle
    preview.phone = v.phone
    preview.bio = v.bio
    preview.avatarUrl = v.avatarUrl
    preview.coverUrl = v.coverUrl
  },
  { deep: true, immediate: true },
)

const initials = computed(() => {
  const name = `${form.firstName} ${form.lastName}`.trim()
  return name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (authStore.user?.email?.[0]?.toUpperCase() ?? 'U')
})

const coverStyle = computed(() => {
  if (preview.coverUrl) {
    return { backgroundImage: `url(${preview.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }

  return {
    background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 28%, #38bdf8 58%, #06b6d4 78%, #a5f3fc 100%)',
  }
})

const themeBadgeIcon = computed(() => {
  const map: Record<string, string> = { light: '☀️', dark: '🌙', system: '🖥️' }
  return map[settings.theme] ?? '☀️'
})

const pwStrength = computed(() => {
  const pw = pwForm.newPw
  let score = 0

  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  return score
})

const pwStrengthLabel = computed(() => ['Weak', 'Fair', 'Good', 'Strong'][pwStrength.value - 1] ?? 'Weak')

function pwStrengthClass(bar: number) {
  if (bar > pwStrength.value) return ''
  const cls = ['pw-weak', 'pw-fair', 'pw-good', 'pw-strong']
  return cls[Math.min(pwStrength.value - 1, 3)]
}

const pwMismatch = computed(
  () => pwForm.newPw.length > 0 && pwForm.confirm.length > 0 && pwForm.newPw !== pwForm.confirm,
)

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) form.avatarUrl = await readFile(file)
}

async function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) form.coverUrl = await readFile(file)
}

const saving = ref(false)
const saveSuccess = ref(false)
const loadingSettings = ref(false)

function toApiTheme(theme: UserSettings['theme']): 'LIGHT' | 'DARK' | 'SYSTEM' {
  if (theme === 'dark') return 'DARK'
  if (theme === 'light') return 'LIGHT'
  return 'SYSTEM'
}

function toUiTheme(theme?: UserSettingsApiData['theme']): UserSettings['theme'] {
  if (theme === 'DARK') return 'dark'
  if (theme === 'LIGHT') return 'light'
  return 'system'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function loadUserSettings() {
  loadingSettings.value = true

  try {
    const response = await get<{ data: UserSettingsApiData }>('/user-settings/me')
    const payload = response?.data
    if (!payload) return

    const resolvedTheme = toUiTheme(payload.theme)
    settings.theme = resolvedTheme
    setTheme(resolvedTheme)

    if (isRecord(payload.notificationSettings)) {
      for (const item of notifications) {
        const enabled = payload.notificationSettings[item.id]
        if (typeof enabled === 'boolean') {
          item.enabled = enabled
        }
      }
    }

    const profile = isRecord(payload.preferences) && isRecord(payload.preferences['profile'])
      ? payload.preferences['profile']
      : null

    if (profile) {
      if (typeof profile.firstName === 'string') form.firstName = profile.firstName
      if (typeof profile.lastName === 'string') form.lastName = profile.lastName
      if (typeof profile.jobTitle === 'string') form.jobTitle = profile.jobTitle
      if (typeof profile.phone === 'string') form.phone = profile.phone
      if (typeof profile.bio === 'string') form.bio = profile.bio
      if (typeof profile.avatarUrl === 'string') form.avatarUrl = profile.avatarUrl
      if (typeof profile.coverUrl === 'string') form.coverUrl = profile.coverUrl
    }

    originalSnapshot.value = buildSnapshot()
  } catch (error) {
    console.error('[SettingsView] Cannot load user settings', error)
  } finally {
    loadingSettings.value = false
  }
}

loadUserSettings()

async function handleSave() {
  if (!isDirty.value || saving.value || loadingSettings.value) return
  if (pwMismatch.value) return

  const userId = authStore.user?.id
  const notificationSettings = Object.fromEntries(
    notifications.map((item) => [item.id, item.enabled]),
  )

  const fullName = `${form.firstName} ${form.lastName}`.trim()
  const preferences = {
    profile: {
      firstName: form.firstName,
      lastName: form.lastName,
      jobTitle: form.jobTitle,
      phone: form.phone,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
      coverUrl: form.coverUrl,
    },
  }

  saving.value = true
  try {
    let updatedUser: User | null = authStore.user

    if (userId) {
      updatedUser = await patch<User>(`/users/${userId}`, {
        fullName,
        avatarUrl: form.avatarUrl,
        coverUrl: form.coverUrl,
        jobTitle: form.jobTitle,
        phone: form.phone,
        bio: form.bio,
        password: pwForm.newPw || undefined,
      })
    }

    await patch('/user-settings/me', {
      theme: toApiTheme(settings.theme),
      notificationSettings,
      preferences,
    })

    // Apply theme to entire app
    setTheme(settings.theme)

    if (updatedUser) {
      authStore.setAuth(authStore.accessToken, updatedUser)
    }

    Object.assign(pwForm, { current: '', newPw: '', confirm: '' })
    originalSnapshot.value = buildSnapshot()

    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3500)
  } catch (error) {
    console.error('[SettingsView] Cannot save user settings', error)
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  Object.assign(form, { ...originalSnapshot.value.form })
  Object.assign(settings, { ...originalSnapshot.value.settings })
  Object.assign(pwForm, { ...originalSnapshot.value.pwForm })

  // Revert theme
  setTheme(originalSnapshot.value.settings.theme)

  for (const n of notifications) {
    const saved = originalSnapshot.value.notifications.find((s) => s.id === n.id)
    if (saved) n.enabled = saved.enabled
  }
}

function applyTheme(theme: UserSettings['theme']) {
  settings.theme = theme
  setTheme(theme)
}
</script>

<style scoped>
.sp-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 48px;
  font-family: 'Inter', system-ui, sans-serif;
}

.sp-cover {
  height: 172px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.sp-cover-upload {
  position: absolute;
  bottom: 12px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: background 0.18s;
  border: 1px solid rgba(255,255,255,0.6);
}
.sp-cover-upload:hover { background: rgba(255,255,255,0.97); }

/* â”€â”€ Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-avatar-wrap {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.sp-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: 4px solid var(--bg-app);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(99,102,241,0.30);
  transition: transform 0.18s;
}
.sp-avatar-wrap:hover .sp-avatar { transform: scale(1.04); }
.sp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.sp-avatar-initials { font-size: 1.6rem; font-weight: 700; color: #fff; line-height: 1; }
.sp-avatar-overlay {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 2px solid var(--bg-app);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: background 0.15s;
}
.sp-avatar-wrap:hover .sp-avatar-overlay { background: var(--bg-active); }

/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-page-header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 0 4px;
  margin-top: -32px;
  position: relative;
  z-index: 10;
  flex-wrap: wrap;
}
.sp-page-title-block { flex: 1; min-width: 0; padding-top: 36px; }
.sp-page-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--text-heading);
  margin: 0;
  letter-spacing: -0.01em;
}
.sp-page-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin: 2px 0 0; }

/* â”€â”€ Action buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-header-actions { display: flex; gap: 10px; align-items: center; margin-top: 36px; }
.btn-secondary {
  height: 38px; padding: 0 18px;
  border-radius: 10px; border: 1.5px solid var(--border-medium);
  background: var(--bg-surface); color: var(--text-muted);
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.18s;
}
.btn-secondary:hover:not(:disabled) { border-color: #a5b4fc; color: #4f46e5; }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary {
  height: 38px; padding: 0 20px;
  border-radius: 10px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 2px 10px rgba(99,102,241,0.30);
  transition: all 0.18s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 18px rgba(99,102,241,0.42); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border-soft);
  margin-top: 20px;
  flex-wrap: wrap;
}
.sp-tab {
  padding: 10px 18px 12px;
  border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500;
  color: var(--text-subtle); cursor: pointer;
  font-family: inherit; position: relative;
  transition: color 0.18s; white-space: nowrap;
}
.sp-tab:hover { color: var(--text-secondary); }
.sp-tab--active { color: #6366f1; font-weight: 700; }
.sp-tab--active::after {
  content: '';
  position: absolute; bottom: -2px; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px 2px 0 0;
}

/* â”€â”€ 2-col Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 28px;
  margin-top: 24px;
  align-items: start;
}
@media (max-width: 900px) {
  .sp-layout { grid-template-columns: 1fr; }
  .sp-preview-col { order: -1; }
}

/* â”€â”€ Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sp-section {
  background: var(--bg-surface);
  border-radius: 18px;
  padding: 28px;
  border: 1.5px solid var(--border-base);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sp-section-title { font-size: 1rem; font-weight: 700; color: var(--text-heading); margin: 0; }
.sp-section-desc  { font-size: 0.8125rem; color: var(--text-subtle); margin: 0; line-height: 1.5; }

.form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 540px) { .form-row.two-col { grid-template-columns: 1fr; } }

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-label {
  font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);
  display: flex; align-items: center; gap: 8px;
}
.badge-readonly {
  font-size: 0.65rem; font-weight: 600;
  color: var(--text-subtle); background: var(--bg-surface-3);
  padding: 2px 6px; border-radius: 6px; text-transform: uppercase;
}
.char-count {
  margin-left: auto; font-size: 0.75rem; font-weight: 500;
  color: #94a3b8; transition: color 0.18s;
}
.char-count--warn { color: #f59e0b; }

.form-input {
  height: 42px; border: 1.5px solid var(--input-border); border-radius: 10px;
  padding: 0 14px; font-size: 0.875rem; color: var(--text-primary);
  background: var(--input-bg); outline: none; font-family: inherit;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.10); }
.form-input:disabled { background: var(--input-disabled); color: var(--text-subtle); cursor: not-allowed; }
.form-input--error { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }

.form-input.form-textarea { height: auto; padding: 12px 14px; resize: vertical; line-height: 1.55; }
.form-error { font-size: 0.8125rem; color: #ef4444; margin: 0; }

.input-icon-wrap { position: relative; }
.input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.form-input.has-icon { padding-left: 38px; }

/* Select */
.select-wrap { position: relative; }
.form-select { width: 100%; appearance: none; padding-right: 36px; cursor: pointer; }
.select-caret { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-subtle); pointer-events: none; }

/* Theme toggle */
.theme-toggle { display: flex; gap: 8px; flex-wrap: wrap; }
.theme-btn {
  flex: 1; min-width: 90px;
  height: 42px; border-radius: 10px;
  border: 1.5px solid var(--border-medium); background: var(--bg-surface-2);
  color: var(--text-muted); font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.18s;
}
.theme-btn:hover { border-color: #c7d2fe; color: #4f46e5; background: var(--bg-hover); }
.theme-btn--active {
  border-color: #6366f1; background: var(--bg-active); color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.10);
}
.theme-btn :deep(svg) { flex-shrink: 0; }

/* Password strength */
.pw-strength { display: flex; align-items: center; gap: 10px; margin-top: -4px; }
.pw-strength-label { font-size: 0.75rem; font-weight: 600; color: #64748b; white-space: nowrap; }
.pw-bars { display: flex; gap: 4px; }
.pw-bar { width: 36px; height: 4px; border-radius: 99px; background: #e2e8f0; transition: background 0.25s; }
.pw-weak  { background: #ef4444; }
.pw-fair  { background: #f59e0b; }
.pw-good  { background: #10b981; }
.pw-strong { background: #6366f1; }
.pw-strength-text { font-size: 0.75rem; font-weight: 700; color: #475569; }

/* Notifications */
.notif-list { display: flex; flex-direction: column; gap: 0; border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border-base); }
.notif-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 18px; border-bottom: 1px solid var(--border-base);
  transition: background 0.15s;
}
.notif-row:last-child { border-bottom: none; }
.notif-row:hover { background: var(--bg-surface-2); }
.notif-info { display: flex; flex-direction: column; gap: 2px; }
.notif-title { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
.notif-desc  { font-size: 0.8rem;  color: var(--text-subtle); }

/* Toggle */
.toggle { position: relative; display: inline-flex; cursor: pointer; flex-shrink: 0; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track {
  width: 44px; height: 24px; border-radius: 999px;
  background: var(--border-medium); position: relative; transition: background 0.22s;
}
.toggle-input:checked ~ .toggle-track { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.20);
  transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
}
.toggle-input:checked ~ .toggle-track .toggle-thumb { transform: translateX(20px); }

/* â”€â”€ Preview Column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.preview-sticky { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 10px; }
.preview-label { font-size: 0.75rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }

.preview-card {
  background: var(--bg-surface);
  border-radius: 18px;
  border: 1.5px solid var(--border-base);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.preview-cover { height: 88px; }

.preview-avatar-wrap { padding: 0 18px; margin-top: -28px; }
.preview-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: 3px solid var(--bg-surface);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(99,102,241,0.28);
}
.preview-avatar-img     { width: 100%; height: 100%; object-fit: cover; }
.preview-avatar-initials { font-size: 1.1rem; font-weight: 700; color: #fff; }

.preview-body { padding: 12px 18px 18px; display: flex; flex-direction: column; gap: 8px; }
.preview-name { font-size: 1rem; font-weight: 800; color: var(--text-heading); margin: 0; letter-spacing: -0.01em; }
.preview-job  { font-size: 0.8125rem; font-weight: 600; color: #6366f1; margin: 0; }
.preview-bio  { font-size: 0.8125rem; color: var(--text-muted); margin: 0; line-height: 1.5; }

.preview-contacts { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
.preview-contact-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; color: var(--text-subtle);
}

.preview-theme-badge {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
}
.preview-theme-badge span {
  font-size: 0.75rem; font-weight: 600;
  color: #6366f1; background: #eef2ff;
  padding: 4px 10px; border-radius: 99px;
}

.preview-tip { font-size: 0.75rem; color: var(--text-subtle); margin: 0; text-align: center; }

/* â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.save-toast {
  position: fixed;
  bottom: 28px; right: 28px;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 20px;
  background: var(--bg-surface);
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  font-size: 0.875rem; font-weight: 600; color: #15803d;
  box-shadow: var(--shadow-lg);
  z-index: 9999;
}

.toast-enter-active { animation: toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { animation: toast-in 0.25s reverse ease-in; }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
</style>
