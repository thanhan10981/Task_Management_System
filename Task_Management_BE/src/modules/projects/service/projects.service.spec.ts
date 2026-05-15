import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectMemberRole } from '../constants/project-role-permissions.constants';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: any;
  let repository: any;
  let access: any;
  let preferences: any;
  let redis: any;

  beforeEach(() => {
    prisma = {
      user: { count: jest.fn() },
      project: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
      $transaction: jest.fn((callback) =>
        callback({
          project: { create: jest.fn().mockResolvedValue({ id: 'project-1', name: 'Octom' }) },
          notification: { createMany: jest.fn() },
        }),
      ),
    };
    repository = {
      findProjectById: jest.fn(),
      deleteProject: jest.fn(),
      listProjectMembers: jest.fn(),
      findProjectSettings: jest.fn(),
      upsertProjectSettings: jest.fn(),
      findProjectMember: jest.fn(),
      addProjectMember: jest.fn(),
      removeProjectMember: jest.fn(),
      updateProjectMemberRole: jest.fn(),
      withTransaction: jest.fn((callback) => callback('tx')),
      createNotification: jest.fn(),
    };
    access = {
      ensureProjectMember: jest.fn(),
      ensureProjectAdminOrOwner: jest.fn(),
    };
    preferences = {
      filterEnabledUserIds: jest.fn().mockResolvedValue([]),
      isEnabled: jest.fn().mockResolvedValue(true),
    };
    redis = { get: jest.fn(), set: jest.fn() };
    service = new ProjectsService(prisma, repository, access, preferences, redis);
  });

  it('creates a project after validating member ids', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.create('owner-1', { name: 'Octom', memberIds: ['owner-1', 'dev-1'] } as any),
    ).resolves.toEqual({ id: 'project-1', name: 'Octom' });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { id: { in: ['dev-1'] } } });
    expect(preferences.filterEnabledUserIds).toHaveBeenCalledWith(['dev-1'], expect.any(String));
  });

  it('rejects create when a selected member does not exist', async () => {
    prisma.user.count.mockResolvedValue(0);

    await expect(service.create('owner-1', { name: 'Octom', memberIds: ['dev-1'] } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists and finds accessible projects', async () => {
    prisma.project.findMany.mockResolvedValue([{ id: 'project-1' }]);
    prisma.project.count.mockResolvedValue(1);

    await expect(service.findAll('user-1', { page: 1, limit: 10, search: 'oct', status: 'ACTIVE' } as any)).resolves.toEqual({
      data: [{ id: 'project-1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
    await expect(service.findOne('user-1', 'project-1')).resolves.toEqual({ id: 'project-1' });
  });

  it('guards owner-only update and delete paths', async () => {
    repository.findProjectById.mockResolvedValue(null);
    await expect(service.update('owner-1', 'missing', { name: 'New' } as any)).rejects.toBeInstanceOf(NotFoundException);

    repository.findProjectById.mockResolvedValue({ id: 'project-1', createdBy: 'other', members: [] });
    await expect(service.remove('owner-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);

    repository.findProjectById.mockResolvedValue({ id: 'project-1', createdBy: 'owner-1', members: [] });
    await expect(service.remove('owner-1', 'project-1')).resolves.toEqual({ success: true });
  });

  it('returns normalized settings and creates reusable invite tokens', async () => {
    repository.findProjectSettings.mockResolvedValue({ rolePermissions: {}, updatedAt: new Date('2026-01-01') });
    await expect(service.getSettings('user-1', 'project-1')).resolves.toMatchObject({
      projectId: 'project-1',
      rolePermissions: expect.objectContaining({ OWNER: { canCreateTask: true } }),
    });

    repository.findProjectById.mockResolvedValue({ id: 'project-1' });
    redis.get.mockResolvedValueOnce('existing-token');
    await expect(service.createInviteToken('owner-1', 'project-1')).resolves.toEqual({ token: 'existing-token' });
  });

  it('joins, leaves, adds, updates, and removes members with role guards', async () => {
    repository.findProjectById.mockResolvedValue({ id: 'project-1', createdBy: 'owner-1', name: 'Octom' });
    repository.findProjectMember.mockResolvedValueOnce(null);
    redis.get.mockResolvedValue('invite');
    repository.addProjectMember.mockResolvedValue({ userId: 'user-2', role: ProjectMemberRole.DEVELOPER });

    await expect(service.joinProject('user-2', 'project-1', { token: 'invite' } as any)).resolves.toEqual({
      userId: 'user-2',
      role: ProjectMemberRole.DEVELOPER,
    });

    repository.findProjectMember.mockResolvedValue({ userId: 'user-2' });
    await expect(service.leaveProject('user-2', 'project-1')).resolves.toEqual({ success: true });

    repository.findProjectMember.mockResolvedValueOnce(null);
    await service.addMember('owner-1', 'project-1', { userId: 'user-2', role: ProjectMemberRole.ADMIN } as any);
    expect(repository.addProjectMember).toHaveBeenLastCalledWith(
      'project-1',
      'user-2',
      ProjectMemberRole.ADMIN,
      'owner-1',
      'tx',
    );

    repository.findProjectMember.mockResolvedValue({ userId: 'user-2' });
    repository.updateProjectMemberRole.mockResolvedValue({ userId: 'user-2', role: ProjectMemberRole.ADMIN });
    await expect(
      service.updateMemberRole('owner-1', 'project-1', 'user-2', { role: ProjectMemberRole.ADMIN } as any),
    ).resolves.toEqual({ userId: 'user-2', role: ProjectMemberRole.ADMIN });

    await expect(service.removeMember('owner-1', 'project-1', 'user-2')).resolves.toEqual({ success: true });
  });
});
