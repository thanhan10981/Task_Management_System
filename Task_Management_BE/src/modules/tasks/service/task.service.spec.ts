import { ConflictException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let repository: any;
  let access: any;
  let preferences: any;
  let assignmentMail: any;

  const task = {
    id: 'task-1',
    title: 'Build',
    description: 'API',
    priority: 'MEDIUM',
    projectId: 'project-1',
    statusId: 'status-1',
    status: { name: 'To Do' },
    groupId: null,
    group: null,
    parentTaskId: null,
    startDate: null,
    dueDate: null,
    createdBy: 'user-1',
  };

  beforeEach(() => {
    repository = {
      findStatusById: jest.fn(),
      findGroupById: jest.fn(),
      findTaskBasicById: jest.fn(),
      findTaskById: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      withTransaction: jest.fn((callback) => callback('tx')),
      assignUser: jest.fn(),
      createTaskHistory: jest.fn(),
      createNotification: jest.fn(),
      findTasks: jest.fn(),
      countTasks: jest.fn(),
      softDeleteTask: jest.fn(),
      restoreTask: jest.fn(),
      listTaskHistory: jest.fn(),
      countTaskHistory: jest.fn(),
      listProjectGroups: jest.fn(),
      createTaskGroup: jest.fn(),
      updateTaskGroup: jest.fn(),
      deleteTaskGroup: jest.fn(),
      listAssignees: jest.fn(),
    };
    access = {
      ensureCanCreateTask: jest.fn(),
      ensureProjectMember: jest.fn().mockResolvedValue({ isOwner: false, role: 'DEVELOPER' }),
      ensureProjectAdminOrOwner: jest.fn(),
      ensureTaskAccess: jest.fn(),
    };
    preferences = {
      isEnabled: jest.fn().mockResolvedValue(true),
      filterEnabledUserIds: jest.fn().mockResolvedValue([]),
    };
    assignmentMail = { sendTaskAssignedEmails: jest.fn() };
    service = new TaskService(repository, access, preferences, assignmentMail);
  });

  it('creates a task with default self assignment and history', async () => {
    repository.findStatusById.mockResolvedValue({ id: 'status-1', projectId: 'project-1', name: 'To Do' });
    repository.createTask.mockResolvedValue(task);

    await expect(
      service.create('user-1', { title: 'Build', projectId: 'project-1', statusId: 'status-1' } as any),
    ).resolves.toEqual(task);
    expect(repository.assignUser).toHaveBeenCalledWith('task-1', 'user-1', 'user-1', 'tx');
    expect(repository.createTaskHistory).toHaveBeenCalled();
    expect(assignmentMail.sendTaskAssignedEmails).toHaveBeenCalledWith({
      assigneeIds: [],
      taskTitle: 'Build',
      projectName: undefined,
    });
  });

  it('rejects create when status or parent is outside project', async () => {
    repository.findStatusById.mockResolvedValue({ id: 'status-1', projectId: 'other' });

    await expect(
      service.create('user-1', { title: 'Build', projectId: 'project-1', statusId: 'status-1' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists tasks with filters and deleted flag', async () => {
    repository.findTasks.mockResolvedValue([task]);
    repository.countTasks.mockResolvedValue(1);

    await expect(
      service.findAll('user-1', {
        page: 2,
        limit: 5,
        projectId: 'project-1',
        search: ' build ',
        deleted: 'true',
      } as any),
    ).resolves.toEqual({
      data: [task],
      meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });
    expect(repository.findTasks).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project-1' }), 5, 5, {
      deletedOnly: true,
    });
  });

  it('finds and updates accessible tasks', async () => {
    repository.findTaskById.mockResolvedValue(task);
    await expect(service.findOne('user-1', 'task-1')).resolves.toEqual(task);

    repository.findTaskBasicById.mockResolvedValue(task);
    repository.updateTask.mockResolvedValue({ ...task, title: 'New' });
    repository.listAssignees.mockResolvedValue([]);

    await expect(service.update('user-1', 'task-1', { title: 'New' } as any)).resolves.toMatchObject({
      title: 'New',
    });
    expect(repository.createTaskHistory).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'UPDATED' }),
      'tx',
    );
  });

  it('guards delete/restore permissions', async () => {
    repository.findTaskBasicById.mockResolvedValue(task);
    access.ensureProjectMember.mockResolvedValue({ isOwner: false, role: 'VIEWER' });
    await expect(service.remove('user-2', 'task-1')).rejects.toBeInstanceOf(ConflictException);

    access.ensureProjectMember.mockResolvedValue({ isOwner: true, role: 'OWNER' });
    await expect(service.remove('user-2', 'task-1')).resolves.toEqual({ success: true });

    repository.restoreTask.mockResolvedValue({ ...task, isDeleted: false });
    await expect(service.restore('user-2', 'task-1')).resolves.toMatchObject({ isDeleted: false });
  });

  it('returns task history and project groups', async () => {
    access.ensureTaskAccess.mockResolvedValue('project-1');
    repository.listTaskHistory.mockResolvedValue([{ id: 'h1' }]);
    repository.countTaskHistory.mockResolvedValue(1);

    await expect(service.getHistory('user-1', 'task-1', { page: 1, limit: 10 } as any)).resolves.toEqual({
      data: [{ id: 'h1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    repository.listProjectGroups.mockResolvedValue([{ id: 'g1', name: 'API', color: '#fff', position: 1, projectId: 'project-1' }]);
    await expect(service.listProjectGroups('user-1', 'project-1')).resolves.toEqual([
      { id: 'g1', name: 'API', color: '#fff', position: 1, projectId: 'project-1' },
    ]);
  });

  it('updates and deletes project groups', async () => {
    repository.findGroupById.mockResolvedValue({ id: 'g1', name: 'API', color: '#fff', projectId: 'project-1' });
    repository.updateTaskGroup.mockResolvedValue({ id: 'g1', name: 'Web', color: '#6366f1', projectId: 'project-1' });

    await expect(
      service.updateProjectGroup('user-1', 'project-1', 'g1', { name: ' Web ', color: '#6366f1' }),
    ).resolves.toMatchObject({ name: 'Web' });
    expect(access.ensureProjectAdminOrOwner).toHaveBeenCalledWith('user-1', 'project-1');
    expect(repository.updateTaskGroup).toHaveBeenCalledWith('g1', { name: 'Web', color: '#6366f1' });

    await expect(service.deleteProjectGroup('user-1', 'project-1', 'g1')).resolves.toEqual({ success: true });
    expect(repository.deleteTaskGroup).toHaveBeenCalledWith('g1');
  });
});
