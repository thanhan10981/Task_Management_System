import { ConflictException, NotFoundException } from '@nestjs/common';
import { TaskStatusService } from './task-status.service';

describe('TaskStatusService', () => {
  let service: TaskStatusService;
  let repository: any;
  let access: any;

  beforeEach(() => {
    repository = {
      listProjectStatuses: jest.fn(),
      createManyTaskStatuses: jest.fn(),
      createTaskStatus: jest.fn(),
      findStatusById: jest.fn(),
      reorderStatuses: jest.fn(),
      updateTaskStatus: jest.fn(),
      countTasksByStatus: jest.fn(),
      deleteTaskStatus: jest.fn(),
    };
    access = {
      ensureProjectMember: jest.fn(),
      ensureProjectAdminOrOwner: jest.fn(),
    };
    service = new TaskStatusService(repository, access);
  });

  it('creates default statuses when a project has none', async () => {
    repository.listProjectStatuses.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'status-1' }]);

    await expect(service.listStatuses('user-1', 'project-1')).resolves.toEqual([{ id: 'status-1' }]);
    expect(repository.createManyTaskStatuses).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ projectId: 'project-1', name: 'Backlog' })]),
    );
  });

  it('creates a status at requested unused position', async () => {
    repository.listProjectStatuses.mockResolvedValue([{ position: 1 }]);
    repository.createTaskStatus.mockResolvedValue({ id: 'status-2' });

    await expect(
      service.createStatus('user-1', 'project-1', { name: 'QA', color: '#fff', position: 3 } as any),
    ).resolves.toEqual({ id: 'status-2' });
    expect(repository.createTaskStatus).toHaveBeenCalledWith(
      expect.objectContaining({ position: 3, isDefault: false, isDone: false }),
    );
  });

  it('updates status and reorders on position change', async () => {
    repository.findStatusById.mockResolvedValue({ id: 'status-1', projectId: 'project-1', position: 1 });
    repository.updateTaskStatus.mockResolvedValue({ id: 'status-1', name: 'Done' });

    await service.updateStatus('user-1', 'project-1', 'status-1', { name: 'Done', position: 2 } as any);

    expect(repository.reorderStatuses).toHaveBeenCalledWith('project-1', 'status-1', 2);
    expect(repository.updateTaskStatus).toHaveBeenCalledWith('status-1', expect.objectContaining({ name: 'Done' }));
  });

  it('rejects missing or used status removal', async () => {
    repository.findStatusById.mockResolvedValue(null);
    await expect(service.removeStatus('user-1', 'project-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);

    repository.findStatusById.mockResolvedValue({ id: 'status-1', projectId: 'project-1' });
    repository.countTasksByStatus.mockResolvedValue(1);
    await expect(service.removeStatus('user-1', 'project-1', 'status-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
