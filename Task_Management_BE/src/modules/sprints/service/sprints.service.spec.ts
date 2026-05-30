import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SprintStatus } from '@prisma/client';
import { SprintsService } from './sprints.service';

describe('SprintsService', () => {
  let prisma: any;
  let service: SprintsService;

  beforeEach(() => {
    prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({ id: 'project-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'project-1', createdBy: 'owner-1', members: [] }),
      },
      sprint: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new SprintsService(prisma);
  });

  it('creates a sprint after validating access and dates', async () => {
    prisma.sprint.create.mockResolvedValue({ id: 'sprint-1', name: 'Sprint 1' });

    await expect(
      service.create('owner-1', {
        projectId: 'project-1',
        name: 'Sprint 1',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
      } as any),
    ).resolves.toEqual({ id: 'sprint-1', name: 'Sprint 1' });
    expect(prisma.sprint.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ createdBy: 'owner-1' }) }));
  });

  it('rejects invalid sprint business rules and inaccessible projects', async () => {
    await expect(
      service.create('owner-1', {
        projectId: 'project-1',
        name: 'Sprint 1',
        startDate: '2026-05-15',
        endDate: '2026-05-01',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.create('owner-1', {
        projectId: 'project-1',
        name: 'Sprint 1',
        status: SprintStatus.COMPLETED,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.create('user-1', { projectId: 'project-1', name: 'Sprint 1' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists and finds accessible sprints', async () => {
    prisma.sprint.findMany.mockResolvedValue([{ id: 'sprint-1' }]);
    prisma.sprint.count.mockResolvedValue(1);

    await expect(service.findAll('user-1', { page: 1, limit: 10, projectId: 'project-1' } as any)).resolves.toEqual({
      data: [{ id: 'sprint-1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    prisma.sprint.findFirst.mockResolvedValue({ id: 'sprint-1' });
    await expect(service.findOne('user-1', 'sprint-1')).resolves.toEqual({ id: 'sprint-1' });

    prisma.sprint.findFirst.mockResolvedValue(null);
    await expect(service.findOne('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates and removes sprints with access checks', async () => {
    prisma.sprint.findUnique.mockResolvedValue({
      id: 'sprint-1',
      projectId: 'project-1',
      status: SprintStatus.PLANNING,
      startDate: null,
      endDate: null,
      completedAt: null,
    });
    prisma.sprint.update.mockResolvedValue({ id: 'sprint-1', name: 'New' });
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', createdBy: 'owner-1', members: [{ role: 'ADMIN' }] });

    await expect(service.update('user-1', 'sprint-1', { name: 'New' } as any)).resolves.toEqual({
      id: 'sprint-1',
      name: 'New',
    });

    await expect(service.remove('owner-1', 'sprint-1')).resolves.toEqual({ success: true });

    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', createdBy: 'other', members: [] });
    await expect(service.remove('owner-1', 'sprint-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
