export type ProjectRolePermissionMatrix = Record<string, { canCreateTask: boolean }>;
export type ProjectMemberRoleName = string;

export const ProjectMemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  VIEWER: 'VIEWER',
} as const;

export const DEFAULT_PROJECT_MEMBER_ROLE = ProjectMemberRole.DEVELOPER;
export const PROJECT_ROLE_NAME_PATTERN = /^[A-Z][A-Z0-9_]{1,39}$/;

export function normalizeProjectRoleName(role: unknown): string | null {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toUpperCase().replace(/\s+/g, '_');
  return PROJECT_ROLE_NAME_PATTERN.test(normalized) ? normalized : null;
}

export const DEFAULT_PROJECT_ROLE_PERMISSIONS: ProjectRolePermissionMatrix = {
  [ProjectMemberRole.OWNER]: { canCreateTask: true },
  [ProjectMemberRole.ADMIN]: { canCreateTask: true },
  MANAGER: { canCreateTask: true },
  [ProjectMemberRole.DEVELOPER]: { canCreateTask: true },
  QA: { canCreateTask: true },
  DESIGNER: { canCreateTask: true },
  [ProjectMemberRole.VIEWER]: { canCreateTask: false },
};

export function normalizeProjectRolePermissions(
  value: unknown,
): ProjectRolePermissionMatrix {
  const normalized: ProjectRolePermissionMatrix = {
    ...DEFAULT_PROJECT_ROLE_PERMISSIONS,
  };

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  for (const [rawRole, roleValue] of Object.entries(value as Record<string, unknown>)) {
    const role = normalizeProjectRoleName(rawRole);
    if (!role) continue;

    if (roleValue && typeof roleValue === 'object') {
      const canCreateTask = (roleValue as Record<string, unknown>).canCreateTask;
      if (typeof canCreateTask === 'boolean') {
        normalized[role] = { canCreateTask };
      }
    }
  }

  normalized[ProjectMemberRole.OWNER] = { canCreateTask: true };
  normalized[ProjectMemberRole.ADMIN] = { canCreateTask: true };
  return normalized;
}
