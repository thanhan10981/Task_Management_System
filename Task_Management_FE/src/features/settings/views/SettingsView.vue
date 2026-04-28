<template>
  <div class="relative flex flex-col gap-0 pb-12 font-[Inter,system-ui,sans-serif]">

    <!-- ── Cover ──────────────────────────────────────────────────────── -->
    <div class="h-[172px] rounded-[18px] relative overflow-hidden flex-shrink-0" :style="coverStyle">
      <label class="sp-cover-upload absolute bottom-3 right-3.5 inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-xs font-semibold text-gray-700 cursor-pointer transition-colors duration-[180ms] border border-white/60" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(8px);">
        <input type="file" accept="image/*" hidden @change="onCoverChange">
        <img :src="uploadCloudIcon" alt="" width="16" height="16" aria-hidden="true">
        Change cover
      </label>
    </div>

    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="flex items-end gap-4 px-1 -mt-8 relative z-10 flex-wrap">
      <!-- Avatar -->
      <label class="sp-avatar-wrap relative cursor-pointer flex-shrink-0" title="Change photo">
        <input type="file" accept="image/*" hidden @change="onAvatarChange">
        <div class="sp-avatar w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 border-4 flex items-center justify-center overflow-hidden transition-transform duration-[180ms]" style="border-color: var(--bg-app); box-shadow: 0 4px 20px rgba(99,102,241,0.30);">
          <img v-if="preview.avatarUrl" :src="preview.avatarUrl" alt="avatar" class="w-full h-full object-cover">
          <span v-else class="text-[1.6rem] font-bold text-white leading-none">{{ initials }}</span>
        </div>
        <div class="sp-avatar-overlay absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center text-indigo-500 transition-colors duration-150" style="background: var(--bg-surface); border: 2px solid var(--bg-app); box-shadow: 0 1px 4px rgba(0,0,0,0.18);">
          <img :src="pencilEditIcon" alt="" width="14" height="14" aria-hidden="true">
        </div>
      </label>
      <div class="flex-1 min-w-0 pt-9">
        <h2 class="text-[1.375rem] font-[800] m-0 tracking-[-0.01em]" style="color: var(--text-heading);">Profile Settings</h2>
        <p class="text-[0.8125rem] mt-0.5 m-0" style="color: var(--text-muted);">{{ preview.fullName || 'Your Name' }} · {{ preview.jobTitle || 'Your role' }}</p>
      </div>

      <div class="flex gap-2.5 items-center mt-9">
        <button
          class="sp-btn-secondary"
          style="border-color: var(--border-medium); background: var(--bg-surface); color: var(--text-muted);"
          :disabled="!isDirty || saving"
          @click="handleCancel"
        >Cancel</button>
        <button
          class="sp-btn-primary"
          style="box-shadow: 0 2px 10px rgba(99,102,241,0.30);"
          :disabled="!isDirty || saving"
          @click="handleSave"
        >
          <span v-if="saving" class="btn-spinner w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white" />
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────────────────── -->
    <nav class="flex gap-0 border-b-2 mt-5 flex-wrap" style="border-color: var(--border-soft);">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="sp-tab"
        :class="activeTab === tab.id ? 'sp-tab--active text-indigo-500 font-bold' : ''"
        :style="activeTab !== tab.id ? `color: var(--text-subtle)` : ''"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </nav>

    <!-- ── Main Layout ─────────────────────────────────────────────────── -->
    <div class="grid grid-cols-[1fr_340px] gap-7 mt-6 items-start max-[900px]:grid-cols-1">

      <!-- Form Column -->
      <div>
        <!-- My Details -->
        <template v-if="activeTab === 'my-details'">
          <section class="settings-section" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
            <div>
              <h3 class="section-title" style="color: var(--text-heading);">Personal information</h3>
              <p class="section-subtitle" style="color: var(--text-subtle);">Update your photo and personal details.</p>
            </div>

            <!-- Full name -->
            <div class="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1">
              <div class="flex flex-col gap-1.5">
                <label class="sp-label flex items-center gap-2" style="color: var(--text-secondary);" for="firstName">First name</label>
                <input id="firstName" v-model="form.firstName" class="sp-input" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="text" placeholder="John">
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="sp-label flex items-center gap-2" style="color: var(--text-secondary);" for="lastName">Last name</label>
                <input id="lastName" v-model="form.lastName" class="sp-input" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="text" placeholder="Doe">
              </div>
            </div>

            <!-- Email (readonly) -->
            <div class="flex flex-col gap-1.5">
              <label class="sp-label flex items-center gap-2" style="color: var(--text-secondary);" for="email">
                Email address
                <span class="text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 rounded-md" style="color: var(--text-subtle); background: var(--bg-surface-3);">read-only</span>
              </label>
              <div class="relative">
                <img :src="emailIcon" alt="" width="15" height="15" class="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                <input id="email" :value="form.email" class="sp-input sp-input--disabled w-full pl-[38px] pr-3.5" style="background: var(--input-disabled); border-color: var(--input-border); color: var(--text-subtle); cursor: not-allowed;" type="email" disabled>
              </div>
            </div>

            <!-- Job title + Phone -->
            <div class="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1">
              <div class="flex flex-col gap-1.5">
                <label class="sp-label" style="color: var(--text-secondary);" for="jobTitle">Job title</label>
                <input id="jobTitle" v-model="form.jobTitle" class="sp-input" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="text" placeholder="Product Designer">
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="sp-label" style="color: var(--text-secondary);" for="phone">Phone</label>
                <div class="relative">
                  <img :src="phoneIcon" alt="" width="14" height="14" class="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                  <input id="phone" v-model="form.phone" class="sp-input w-full pl-[38px] pr-3.5" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="tel" placeholder="+1 234 567 8900">
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div class="flex flex-col gap-1.5">
              <label class="sp-label flex items-center gap-2" style="color: var(--text-secondary);" for="bio">
                Bio
                <span class="ml-auto text-xs font-medium text-slate-400 transition-colors duration-[180ms]" :class="form.bio.length > 180 ? 'text-amber-500' : ''">
                  {{ form.bio.length }}/200
                </span>
              </label>
              <textarea
                id="bio"
                v-model="form.bio"
                class="sp-input rounded-[10px] border-[1.5px] px-3.5 py-3 h-auto resize-y leading-[1.55]"
                style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);"
                rows="4"
                maxlength="200"
                placeholder="Tell your team a little about yourself…"
              />
            </div>
          </section>
        </template>

        <!-- Preferences -->
        <template v-else-if="activeTab === 'preferences'">
          <section class="settings-section" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
            <div>
              <h3 class="section-title" style="color: var(--text-heading);">App preferences</h3>
              <p class="section-subtitle" style="color: var(--text-subtle);">Customize your theme.</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="sp-label" style="color: var(--text-secondary);">Theme</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="t in themes"
                  :key="t.value"
                  class="sp-theme-btn flex-1 min-w-[90px] h-[42px] rounded-[10px] border-[1.5px] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] inline-flex items-center justify-center gap-1.5 transition-all duration-[180ms]"
                  :class="settings.theme === t.value ? 'sp-theme-btn--active' : ''"
                  :style="settings.theme === t.value
                    ? `border-color: #6366f1; background: var(--bg-active); color: #4f46e5; box-shadow: 0 0 0 3px rgba(99,102,241,0.10);`
                    : `border-color: var(--border-medium); background: var(--bg-surface-2); color: var(--text-muted);`"
                  @click="applyTheme(t.value)"
                >
                  <span v-html="t.icon" class="flex-shrink-0" />
                  {{ t.label }}
                </button>
              </div>
            </div>
          </section>
        </template>

        <!-- Password -->
        <template v-else-if="activeTab === 'password'">
          <section class="settings-section" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
            <div>
              <h3 class="section-title" style="color: var(--text-heading);">Change password</h3>
              <p class="section-subtitle" style="color: var(--text-subtle);">Use a strong password you don't use elsewhere.</p>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="sp-label" style="color: var(--text-secondary);" for="currentPw">Current password</label>
              <input id="currentPw" v-model="pwForm.current" class="sp-input" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="password" placeholder="••••••••">
            </div>

            <div class="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1">
              <div class="flex flex-col gap-1.5">
                <label class="sp-label" style="color: var(--text-secondary);" for="newPw">New password</label>
                <input id="newPw" v-model="pwForm.newPw" class="sp-input" style="background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);" type="password" placeholder="••••••••">
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="sp-label" style="color: var(--text-secondary);" for="confirmPw">Confirm new password</label>
                <input
                  id="confirmPw"
                  v-model="pwForm.confirm"
                  class="sp-input"
                  :style="pwMismatch
                    ? 'background: var(--input-bg); border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.10); color: var(--text-primary);'
                    : 'background: var(--input-bg); border-color: var(--input-border); color: var(--text-primary);'"
                  type="password"
                  placeholder="••••••••"
                >
              </div>
            </div>
            <p v-if="pwMismatch" class="text-[0.8125rem] text-red-500 m-0">Passwords do not match.</p>

            <!-- Password strength -->
            <div v-if="pwForm.newPw.length > 0" class="flex items-center gap-2.5 -mt-1">
              <span class="text-xs font-semibold text-slate-500 whitespace-nowrap">Strength:</span>
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="w-9 h-1 rounded-full transition-colors duration-[250ms]"
                  :class="i <= pwStrength
                    ? (pwStrength === 1 ? 'bg-red-500' : pwStrength === 2 ? 'bg-amber-500' : pwStrength === 3 ? 'bg-emerald-500' : 'bg-indigo-500')
                    : 'bg-slate-200'"
                />
              </div>
              <span class="text-xs font-bold text-slate-600">{{ pwStrengthLabel }}</span>
            </div>
          </section>
        </template>

        <!-- Notifications -->
        <template v-else-if="activeTab === 'notifications'">
          <section class="settings-section" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-sm);">
            <div>
              <h3 class="section-title" style="color: var(--text-heading);">Notification preferences</h3>
              <p class="section-subtitle" style="color: var(--text-subtle);">Choose what you want to be notified about.</p>
            </div>
            <div class="flex flex-col gap-0 rounded-xl overflow-hidden border-[1.5px]" style="border-color: var(--border-base);">
              <div
                v-for="n in notifications"
                :key="n.id"
                class="notif-row flex items-center justify-between gap-4 px-[18px] py-3.5 border-b border-b-[var(--border-base)] last:border-b-0 transition-colors duration-150"
              >
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-semibold" style="color: var(--text-primary);">{{ n.title }}</span>
                  <span class="text-[0.8rem]" style="color: var(--text-subtle);">{{ n.desc }}</span>
                </div>
                <label class="relative inline-flex cursor-pointer flex-shrink-0">
                  <input v-model="n.enabled" type="checkbox" class="toggle-input absolute opacity-0 w-0 h-0">
                  <span class="toggle-track block w-11 h-6 rounded-full relative transition-colors duration-[220ms]">
                    <span class="toggle-thumb absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]" style="box-shadow: 0 1px 4px rgba(0,0,0,0.20);" />
                  </span>
                </label>
              </div>
            </div>
          </section>
        </template>
      </div>

      <!-- ── Right: Live Preview ──────────────────────────────────────── -->
      <aside class="max-[900px]:-order-1">
        <div class="sticky top-20 flex flex-col gap-2.5">
          <p class="text-xs font-bold uppercase tracking-[0.06em] m-0" style="color: var(--text-subtle);">Live preview</p>
          <div class="rounded-[18px] border-[1.5px] overflow-hidden" style="background: var(--bg-surface); border-color: var(--border-base); box-shadow: var(--shadow-md);">
            <!-- Mini cover -->
            <div class="h-[88px]" :style="coverStyle" />
            <!-- Avatar -->
            <div class="px-[18px] -mt-7">
              <div class="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center overflow-hidden border-[3px]" style="border-color: var(--bg-surface); box-shadow: 0 2px 10px rgba(99,102,241,0.28);">
                <img v-if="preview.avatarUrl" :src="preview.avatarUrl" alt="avatar" class="w-full h-full object-cover">
                <span v-else class="text-[1.1rem] font-bold text-white">{{ initials }}</span>
              </div>
            </div>
            <!-- Info -->
            <div class="px-[18px] pb-[18px] pt-3 flex flex-col gap-2">
              <h4 class="text-base font-[800] m-0 tracking-[-0.01em]" style="color: var(--text-heading);">{{ preview.fullName || 'Your Name' }}</h4>
              <p class="text-[0.8125rem] font-semibold text-indigo-500 m-0">{{ preview.jobTitle || 'Job title' }}</p>
              <p v-if="preview.bio" class="text-[0.8125rem] m-0 leading-relaxed" style="color: var(--text-muted);">{{ preview.bio }}</p>
              <div class="flex flex-col gap-1 mt-1">
                <div v-if="preview.phone" class="flex items-center gap-1.5 text-xs" style="color: var(--text-subtle);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6z"/></svg>
                  {{ preview.phone }}
                </div>
                <div v-if="preview.email" class="flex items-center gap-1.5 text-xs" style="color: var(--text-subtle);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {{ preview.email }}
                </div>
              </div>
              <div class="mt-2">
                <span class="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {{ themeBadgeIcon }} {{ settings.theme }} theme
                </span>
              </div>
            </div>
          </div>
          <p class="text-xs text-center m-0" style="color: var(--text-subtle);">Changes appear here as you type.</p>
        </div>
      </aside>
    </div>

    <!-- ── Save toast ─────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="saveSuccess" class="fixed bottom-7 right-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl border-[1.5px] border-green-200 text-sm font-semibold text-green-700 z-[9999]" style="background: var(--bg-surface); box-shadow: var(--shadow-lg);">
        <img :src="checkIcon" alt="" width="16" height="16" aria-hidden="true">
        Profile saved successfully!
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'
import uploadCloudIcon from '@/assets/icons/upload-cloud.svg?url'
import pencilEditIcon from '@/assets/icons/pencil-edit.svg?url'
import emailIcon from '@/assets/icons/email.svg?url'
import phoneIcon from '@/assets/icons/phone.svg?url'
import checkIcon from '@/assets/icons/check.svg?url'
import {
  useSaveUserSettingsMutation,
  useUserSettingsQuery,
  type UserSettingsApiData,
} from '../composables/useUserSettings'

interface ProfileForm {
  firstName: string; lastName: string; email: string
  jobTitle: string; phone: string; bio: string
  avatarUrl: string; coverUrl: string
}
interface UserSettings { theme: 'light' | 'dark' | 'system' }
interface PasswordForm { current: string; newPw: string; confirm: string }
interface ProfilePreview extends ProfileForm { fullName: string }
interface Notification { id: string; title: string; desc: string; enabled: boolean }
interface ThemeOption { value: UserSettings['theme']; label: string; icon: string }
interface SettingsSnapshot {
  form: ProfileForm; settings: UserSettings; pwForm: PasswordForm
  notifications: Array<{ id: string; enabled: boolean }>
}

const authStore = useAuthStore()
const { themeMode, setTheme } = useTheme()
const userSettingsQuery = useUserSettingsQuery()
const saveUserSettingsMutation = useSaveUserSettingsMutation()

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
  { value: 'light', label: 'Light', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` },
  { value: 'dark', label: 'Dark', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` },
  { value: 'system', label: 'System', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
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
  return { form: { ...form }, settings: { ...settings }, pwForm: { ...pwForm }, notifications: notifications.map((n) => ({ id: n.id, enabled: n.enabled })) }
}

const originalSnapshot = ref<SettingsSnapshot>(buildSnapshot())
const isDirty = computed(() => JSON.stringify(buildSnapshot()) !== JSON.stringify(originalSnapshot.value))

const preview = reactive<ProfilePreview>({ ...DUMMY, fullName: `${DUMMY.firstName} ${DUMMY.lastName}`.trim() })

watch(form, (v) => {
  preview.firstName = v.firstName; preview.lastName = v.lastName
  preview.fullName = `${v.firstName} ${v.lastName}`.trim()
  preview.email = v.email; preview.jobTitle = v.jobTitle
  preview.phone = v.phone; preview.bio = v.bio
  preview.avatarUrl = v.avatarUrl; preview.coverUrl = v.coverUrl
}, { deep: true, immediate: true })

const initials = computed(() => {
  const name = `${form.firstName} ${form.lastName}`.trim()
  return name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (authStore.user?.email?.[0]?.toUpperCase() ?? 'U')
})

const coverStyle = computed(() => {
  if (preview.coverUrl) return { backgroundImage: `url(${preview.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  return { background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 28%, #38bdf8 58%, #06b6d4 78%, #a5f3fc 100%)' }
})

const themeBadgeIcon = computed(() => ({ light: '☀️', dark: '🌙', system: '🖥️' }[settings.theme] ?? '☀️'))

const pwStrength = computed(() => {
  const pw = pwForm.newPw; let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
})

const pwStrengthLabel = computed(() => ['Weak', 'Fair', 'Good', 'Strong'][pwStrength.value - 1] ?? 'Weak')
const pwMismatch = computed(() => pwForm.newPw.length > 0 && pwForm.confirm.length > 0 && pwForm.newPw !== pwForm.confirm)

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result as string); reader.readAsDataURL(file) })
}

async function onAvatarChange(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (file) form.avatarUrl = await readFile(file) }
async function onCoverChange(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (file) form.coverUrl = await readFile(file) }

const saveSuccess = ref(false)
const saving = computed(() => saveUserSettingsMutation.isPending.value)
const loadingSettings = computed(() => userSettingsQuery.isLoading.value)

function toApiTheme(theme: UserSettings['theme']): 'LIGHT' | 'DARK' | 'SYSTEM' {
  if (theme === 'dark') return 'DARK'; if (theme === 'light') return 'LIGHT'; return 'SYSTEM'
}
function toUiTheme(theme?: UserSettingsApiData['theme']): UserSettings['theme'] {
  if (theme === 'DARK') return 'dark'; if (theme === 'LIGHT') return 'light'; return 'system'
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }

function applyLoadedUserSettings(payload?: UserSettingsApiData) {
  if (!payload) return
  const resolvedTheme = toUiTheme(payload.theme)
  settings.theme = resolvedTheme; setTheme(resolvedTheme)
  if (isRecord(payload.notificationSettings)) {
    for (const item of notifications) {
      const enabled = payload.notificationSettings[item.id]
      if (typeof enabled === 'boolean') item.enabled = enabled
    }
  }
  const profile = isRecord(payload.preferences) && isRecord(payload.preferences['profile']) ? payload.preferences['profile'] : null
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
}

watch(() => userSettingsQuery.data.value?.data, (payload) => { applyLoadedUserSettings(payload) }, { immediate: true })
watch(() => userSettingsQuery.error.value, (error) => { if (error) console.error('[SettingsView] Cannot load user settings', error) })

async function handleSave() {
  if (!isDirty.value || saving.value || loadingSettings.value || pwMismatch.value) return
  const userId = authStore.user?.id
  const notificationSettings = Object.fromEntries(notifications.map((item) => [item.id, item.enabled]))
  const fullName = `${form.firstName} ${form.lastName}`.trim()
  const preferences = { profile: { firstName: form.firstName, lastName: form.lastName, jobTitle: form.jobTitle, phone: form.phone, bio: form.bio, avatarUrl: form.avatarUrl, coverUrl: form.coverUrl } }
  try {
    await saveUserSettingsMutation.mutateAsync({ userId, userProfile: { fullName, avatarUrl: form.avatarUrl, coverUrl: form.coverUrl, jobTitle: form.jobTitle, phone: form.phone, bio: form.bio, password: pwForm.newPw || undefined }, settings: { theme: toApiTheme(settings.theme), notificationSettings, preferences } })
    setTheme(settings.theme)
    Object.assign(pwForm, { current: '', newPw: '', confirm: '' })
    originalSnapshot.value = buildSnapshot()
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3500)
  } catch (error) { console.error('[SettingsView] Cannot save user settings', error) }
}

function handleCancel() {
  Object.assign(form, { ...originalSnapshot.value.form })
  Object.assign(settings, { ...originalSnapshot.value.settings })
  Object.assign(pwForm, { ...originalSnapshot.value.pwForm })
  setTheme(originalSnapshot.value.settings.theme)
  for (const n of notifications) { const saved = originalSnapshot.value.notifications.find((s) => s.id === n.id); if (saved) n.enabled = saved.enabled }
}

function applyTheme(theme: UserSettings['theme']) { settings.theme = theme; setTheme(theme) }
</script>

<style scoped>
/* 1. Cover upload button hover */
.sp-cover-upload:hover { background: rgba(255,255,255,0.97); }

/* 2. Avatar hover scale */
.sp-avatar-wrap:hover .sp-avatar { transform: scale(1.04); }
.sp-avatar-wrap:hover .sp-avatar-overlay { background: var(--bg-active); }

/* 3. Button hovers — CSS variables */
.sp-btn-secondary:hover:not(:disabled) { border-color: #a5b4fc; color: #4f46e5; }
.sp-btn-primary:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 18px rgba(99,102,241,0.42); }

/* 4. Theme button hover — CSS vars */
.sp-theme-btn:hover { border-color: #c7d2fe; color: #4f46e5; background: var(--bg-hover); }

/* 5. Form input focus — CSS vars */
.sp-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.10); }

/* 6. Tab active indicator — ::after pseudo-element */
.sp-tab--active::after {
  content: '';
  position: absolute; bottom: -2px; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px 2px 0 0;
}

/* 7. Notification row hover — CSS var */
.notif-row:hover { background: var(--bg-surface-2); }

/* 8. Toggle switch — default + :checked state */
.toggle-track { background: var(--border-medium); }
.toggle-input:checked ~ .toggle-track { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
.toggle-input:checked ~ .toggle-track .toggle-thumb { transform: translateX(20px); }

/* 9. Spinner + @keyframes */
.btn-spinner {
  animation: spin 0.7s linear infinite;
  border-radius: 50%;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 10. Toast animation */
.toast-enter-active { animation: toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { animation: toast-in 0.25s reverse ease-in; }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
