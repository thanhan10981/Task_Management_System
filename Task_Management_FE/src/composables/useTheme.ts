import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'tm-theme'

// ── Singleton state (module-level so all components share the same ref) ──────
const themeMode = ref<ThemeMode>('system')
let mediaQuery: MediaQueryList | null = null
let mediaListener: (() => void) | null = null

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyToDOM(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'system' && getSystemDark())
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

function setupMediaListener() {
  if (mediaQuery && mediaListener) {
    mediaQuery.removeEventListener('change', mediaListener)
  }
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaListener = () => {
    if (themeMode.value === 'system') {
      applyToDOM('system')
    }
  }
  mediaQuery.addEventListener('change', mediaListener)
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useTheme() {
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      themeMode.value = saved
    }
    applyToDOM(themeMode.value)
    setupMediaListener()
  }

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
    applyToDOM(mode)
  }

  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return getSystemDark()
  })

  onMounted(() => {
    setupMediaListener()
  })

  onUnmounted(() => {
    // Only remove if no more watchers — keep singleton alive
  })

  // Keep DOM in sync when themeMode changes programmatically
  watch(themeMode, (mode) => applyToDOM(mode))

  return {
    themeMode,
    isDark,
    setTheme,
    initTheme,
  }
}
