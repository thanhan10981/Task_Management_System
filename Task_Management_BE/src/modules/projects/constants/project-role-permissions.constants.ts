import { ProjectMemberRole } from '@prisma/client';

export type ProjectRolePermissionMatrix = Record<string, { canCreateTask: boolean }>;

export const DEFAULT_PROJECT_ROLE_PERMISSIONS: ProjectRolePermissionMatrix = {
  [ProjectMemberRole.OWNER]: { canCreateTask: true },
  [ProjectMemberRole.ADMIN]: { canCreateTask: true },
  [ProjectMemberRole.DEVELOPER]: { canCreateTask: true },
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

  for (const role of [ProjectMemberRole.DEVELOPER, ProjectMemberRole.VIEWER]) {
    const roleValue = (value as Record<string, unknown>)[role];
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
