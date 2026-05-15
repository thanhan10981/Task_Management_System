import {
  ProjectMemberRole,
  DEFAULT_PROJECT_ROLE_PERMISSIONS,
  normalizeProjectRolePermissions,
} from './project-role-permissions.constants';

describe('normalizeProjectRolePermissions', () => {
  it('returns defaults for invalid values', () => {
    expect(normalizeProjectRolePermissions(null)).toEqual(DEFAULT_PROJECT_ROLE_PERMISSIONS);
  });

  it('allows developer and viewer overrides only', () => {
    expect(
      normalizeProjectRolePermissions({
        [ProjectMemberRole.OWNER]: { canCreateTask: false },
        [ProjectMemberRole.ADMIN]: { canCreateTask: false },
        [ProjectMemberRole.DEVELOPER]: { canCreateTask: false },
        [ProjectMemberRole.VIEWER]: { canCreateTask: true },
      }),
    ).toEqual({
      [ProjectMemberRole.OWNER]: { canCreateTask: true },
      [ProjectMemberRole.ADMIN]: { canCreateTask: true },
      [ProjectMemberRole.DEVELOPER]: { canCreateTask: false },
      [ProjectMemberRole.VIEWER]: { canCreateTask: true },
    });
  });
});
