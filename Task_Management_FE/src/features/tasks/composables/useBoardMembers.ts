import { createProjectInviteToken } from '@/api/projects'
import { INVITE_TOKEN_QUERY_KEY } from '@/features/projects/constants/invite.constants'
import { useUsersQuery } from '@/features/users/composables/useUsersQuery'
import type { User } from '@/types/user.types'
import type { ComputedRef, Ref } from 'vue'
import { computed, nextTick, ref } from 'vue'

export type ProjectMember = {
  id: string
  name: string
  initials: string
  color: string
  role?: string
  email?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  jobTitle?: string | null
  phone?: string | null
  bio?: string | null
}

type RolePermissionMatrix = Record<string, { canCreateTask: boolean }>

type BoardMembersDeps = {
  authUserId: ComputedRef<string | null>
  members: ComputedRef<ProjectMember[]>
  effectiveProjectId: ComputedRef<string | null>
  projectRolePermissions: ComputedRef<unknown>
  sprintMenuOpen: Ref<boolean>
  activeCardMenu: Ref<string | null>
  syncBoardFromStore: () => void
  addMemberToProject: (projectId: string, userId: string) => Promise<unknown>
  removeMemberFromProject: (projectId: string, userId: string) => Promise<unknown>
  updateMemberRoleInProject: (projectId: string, userId: string, role: string) => Promise<unknown>
  toast: {
    success: (message: string) => void
    error: (message: string) => void
  }
}

export function useBoardMembers(deps: BoardMembersDeps) {
  const memberPickerOpen = ref(false)
  const memberSearch = ref('')
  const memberPickerRef = ref<HTMLElement | null>(null)
  const memberPickerBtnRef = ref<HTMLElement | null>(null)
  const memberPickerDropRef = ref<HTMLElement | null>(null)
  const memberSearchInput = ref<HTMLInputElement | null>(null)
  const memberPickerStyle = ref<Record<string, string>>({})
  const visibleAvatarCount = 4
  const addingMemberId = ref<string | null>(null)
  const removingMemberId = ref<string | null>(null)
  const updatingRoleMemberId = ref<string | null>(null)
  const fixedRoleOptions = ['ADMIN', 'DEVELOPER', 'VIEWER']

  const assignableUsersQuery = useUsersQuery(memberSearch, {
    enabled: computed(() =>
      Boolean(memberPickerOpen.value && deps.effectiveProjectId.value && memberSearch.value.trim())
    ),
  })

  const selectedProjectMemberIds = computed(() =>
    new Set(deps.members.value.map((member) => member.id))
  )

  const searchedUsers = computed(() => {
    if (!memberSearch.value.trim()) return []
    return (assignableUsersQuery.data.value ?? [])
      .filter((user) => !selectedProjectMemberIds.value.has(user.id))
      .slice(0, 8)
  })

  const inviteToken = ref<string | null>(null)
  const baseInviteLink = computed(() => {
    if (!deps.effectiveProjectId.value) return ''
    if (typeof window === 'undefined') return `/projects/${deps.effectiveProjectId.value}/join`
    return `${window.location.origin}/projects/${deps.effectiveProjectId.value}/join`
  })

  function buildInviteLink(token: string) {
    const base = baseInviteLink.value
    if (!base) return ''
    return `${base}?${INVITE_TOKEN_QUERY_KEY}=${encodeURIComponent(token)}`
  }

  async function copyTextToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }
    } catch {
      // Some browsers expose Clipboard API but reject it outside secure/user-activation contexts.
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      const copied = document.execCommand('copy')
      if (!copied) throw new Error('Copy command failed')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  const currentUserProjectMember = computed<ProjectMember | null>(() =>
    deps.members.value.find((member) => member.id === deps.authUserId.value) ?? null
  )

  const canManageProjectMembers = computed(() => {
    const role = (currentUserProjectMember.value?.role || '').toUpperCase()
    return role === 'OWNER' || role === 'ADMIN'
  })

  const defaultRolePermissions: RolePermissionMatrix = {
    OWNER: { canCreateTask: true },
    ADMIN: { canCreateTask: true },
    MANAGER: { canCreateTask: true },
    DEVELOPER: { canCreateTask: true },
    QA: { canCreateTask: true },
    DESIGNER: { canCreateTask: true },
    VIEWER: { canCreateTask: false },
  }

  const rolePermissions = computed<RolePermissionMatrix>(() => {
    const maybeMatrix = deps.projectRolePermissions.value
    if (!maybeMatrix || typeof maybeMatrix !== 'object') return defaultRolePermissions

    const safe: RolePermissionMatrix = { ...defaultRolePermissions }
    for (const role of Object.keys(defaultRolePermissions)) {
      const value = (maybeMatrix as Record<string, unknown>)[role]
      if (value && typeof value === 'object') {
        const canCreateTask = (value as Record<string, unknown>).canCreateTask
        if (typeof canCreateTask === 'boolean') safe[role] = { canCreateTask }
      }
    }
    return safe
  })

  const memberRoleOptions = computed(() => {
    const roles = Object.keys(rolePermissions.value)
      .map((role) => role.trim().toUpperCase())
      .filter((role) => role && role !== 'OWNER')
    return [...new Set([...fixedRoleOptions, ...roles])]
  })

  const canCurrentUserCreateTask = computed(() => {
    const role = (currentUserProjectMember.value?.role || 'DEVELOPER').toUpperCase()
    if (role === 'OWNER' || role === 'ADMIN') return true
    return rolePermissions.value[role]?.canCreateTask ?? false
  })

  function userInitials(user: User) {
    const raw = (user.fullName || user.email).trim()
    return raw
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  function userAvatarColor(user: User) {
    const seed = user.id || user.email
    const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f97316']
    const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return palette[hash % palette.length]
  }

  function isProjectOwner(member: { role?: string | null }) {
    return (member.role || '').toUpperCase() === 'OWNER'
  }

  function canUpdateMemberRole(member: { id: string; role?: string | null }) {
    if (!canManageProjectMembers.value) return false
    if (isProjectOwner(member)) return false
    if (member.id === deps.authUserId.value) return false
    return true
  }

  function updateMemberPickerPos() {
    const btn = memberPickerBtnRef.value
    if (typeof window === 'undefined') return

    if (!btn) {
      memberPickerStyle.value = {
        position: 'fixed',
        top: '76px',
        left: '12px',
        right: '12px',
        width: 'min(260px, calc(100vw - 24px))',
        zIndex: '9999',
      }
      return
    }

    const rect = btn.getBoundingClientRect()
    const dropWidth = 260
    const viewportW = window.innerWidth
    const left = Math.max(12, Math.min(rect.right - dropWidth, viewportW - dropWidth - 12))

    memberPickerStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 10}px`,
      left: `${left}px`,
      right: 'auto',
      width: `${dropWidth}px`,
      zIndex: '9999',
    }
  }

  async function openMemberPicker() {
    memberPickerOpen.value = true
    deps.sprintMenuOpen.value = false
    deps.activeCardMenu.value = null
    await nextTick()
    updateMemberPickerPos()
    requestAnimationFrame(() => updateMemberPickerPos())
    memberSearchInput.value?.focus()
  }

  async function addMemberFromPicker(user: User) {
    if (!deps.effectiveProjectId.value || addingMemberId.value) return

    addingMemberId.value = user.id
    try {
      await deps.addMemberToProject(deps.effectiveProjectId.value, user.id)
      memberSearch.value = ''
      deps.syncBoardFromStore()
      deps.toast.success(`Added ${user.fullName || user.email} to this project`)
    } catch {
      deps.toast.error('Cannot add member to this project')
    } finally {
      addingMemberId.value = null
    }
  }

  async function removeMemberFromPicker(member: { id: string; name: string; role?: string | null }) {
    if (!deps.effectiveProjectId.value || removingMemberId.value) return
    if (!canManageProjectMembers.value) return
    if (isProjectOwner(member)) return

    removingMemberId.value = member.id
    try {
      await deps.removeMemberFromProject(deps.effectiveProjectId.value, member.id)
      deps.syncBoardFromStore()
      deps.toast.success(`Removed ${member.name} from this project`)
    } catch {
      deps.toast.error('Cannot remove member from this project')
    } finally {
      removingMemberId.value = null
    }
  }

  async function updateMemberRoleFromPicker(member: ProjectMember, role: string) {
    const nextRole = role.trim().toUpperCase()
    const currentRole = (member.role || 'DEVELOPER').toUpperCase()
    const allowedRoles = new Set(memberRoleOptions.value)
    if (!deps.effectiveProjectId.value || updatingRoleMemberId.value) return
    if (!allowedRoles.has(nextRole)) return
    if (!canUpdateMemberRole(member) || nextRole === currentRole) return

    updatingRoleMemberId.value = member.id
    try {
      await deps.updateMemberRoleInProject(deps.effectiveProjectId.value, member.id, nextRole)
      deps.syncBoardFromStore()
      deps.toast.success(`Updated ${member.name} role to ${nextRole}`)
    } catch {
      deps.toast.error('Cannot update member role')
    } finally {
      updatingRoleMemberId.value = null
    }
  }

  function onMemberPickerDocClick(e: MouseEvent) {
    const target = e.target as Node
    if (
      memberPickerRef.value &&
      !memberPickerRef.value.contains(target) &&
      !memberPickerDropRef.value?.contains(target)
    ) {
      memberPickerOpen.value = false
    }
  }

  async function copyInviteLink() {
    if (!deps.effectiveProjectId.value || !baseInviteLink.value) {
      deps.toast.error('Cannot create invite link for this project')
      return
    }

    if (!canManageProjectMembers.value) {
      deps.toast.error('Only project owner or admin can create invite links')
      return
    }

    try {
      const tokenResponse = await createProjectInviteToken(deps.effectiveProjectId.value)
      inviteToken.value = tokenResponse?.token || null
      if (!inviteToken.value) {
        deps.toast.error('Cannot create invite link for this project')
        return
      }

      const link = buildInviteLink(inviteToken.value)
      await copyTextToClipboard(link)
      deps.toast.success('Invite link copied')
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      deps.toast.error(
        status === 403
          ? 'Only project owner or admin can create invite links'
          : 'Cannot copy invite link'
      )
    }
  }

  return {
    memberPickerOpen,
    memberSearch,
    memberPickerRef,
    memberPickerBtnRef,
    memberPickerDropRef,
    memberSearchInput,
    memberPickerStyle,
    visibleAvatarCount,
    addingMemberId,
    removingMemberId,
    updatingRoleMemberId,
    memberRoleOptions,
    assignableUsersQuery,
    searchedUsers,
    canManageProjectMembers,
    canCurrentUserCreateTask,
    userInitials,
    userAvatarColor,
    isProjectOwner,
    canUpdateMemberRole,
    updateMemberPickerPos,
    openMemberPicker,
    addMemberFromPicker,
    removeMemberFromPicker,
    updateMemberRoleFromPicker,
    onMemberPickerDocClick,
    copyInviteLink,
  }
}
