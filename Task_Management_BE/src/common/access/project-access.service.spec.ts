import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectMemberRole } from '../../modules/projects/constants/project-role-permissions.constants';
import { ProjectAccessService } from './project-access.service';

describe('ProjectAccessService', () => {
  let prisma: any;
  let service: ProjectAccessService;

  beforeEach(() => {
    prisma = {
      project: { findUnique: jest.fn() },
      task: { findUnique: jest.fn() },
      $queryRaw: jest.fn(),
    };
    service = new ProjectAccessService(prisma);
  });

  it('returns owner/member access context', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdBy: 'owner-1',
      members: [],
    });

    await expect(service.ensureProjectMember('owner-1', 'project-1')).resolves.toEqual({
      projectId: 'project-1',
      isOwner: true,
      role: null,
    });
  });

  it('rejects missing projects and non-members', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.ensureProjectMember('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);

    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', createdBy: 'owner-1', members: [] });
    await expect(service.ensureProjectMember('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires admin or owner for admin-only actions', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdBy: 'owner-1',
      members: [{ role: ProjectMemberRole.DEVELOPER }],
    });

    await expect(service.ensureProjectAdminOrOwner('dev-1', 'project-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdBy: 'owner-1',
      members: [{ role: ProjectMemberRole.ADMIN }],
    });
    await expect(service.ensureProjectAdminOrOwner('admin-1', 'project-1')).resolves.toMatchObject({
      role: ProjectMemberRole.ADMIN,
    });
  });

  it('checks role settings before allowing task creation', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdBy: 'owner-1',
      members: [{ role: ProjectMemberRole.VIEWER }],
    });
    prisma.$queryRaw.mockResolvedValue([{ rolePermissions: { VIEWER: { canCreateTask: false } } }]);

    await expect(service.ensureCanCreateTask('viewer-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);

    prisma.$queryRaw.mockResolvedValue([{ rolePermissions: { VIEWER: { canCreateTask: true } } }]);
    await expect(service.ensureCanCreateTask('viewer-1', 'project-1')).resolves.toMatchObject({
      role: ProjectMemberRole.VIEWER,
    });
  });

  it('ensures task access through project membership', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      createdBy: 'user-1',
      members: [],
    });

    await expect(service.ensureTaskAccess('user-1', 'task-1')).resolves.toBe('project-1');

    prisma.task.findUnique.mockResolvedValue(null);
    await expect(service.ensureTaskAccess('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
