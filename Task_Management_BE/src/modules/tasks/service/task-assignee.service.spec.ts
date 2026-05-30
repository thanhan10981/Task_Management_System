import { ConflictException, NotFoundException } from '@nestjs/common';
import { TaskAssigneeService } from './task-assignee.service';

describe('TaskAssigneeService', () => {
  let service: TaskAssigneeService;
  let repository: any;
  let access: any;
  let preferences: any;
  let assignmentMail: any;

  beforeEach(() => {
    repository = {
      findTaskBasicById: jest.fn(),
      findAssignment: jest.fn(),
      withTransaction: jest.fn((callback) => callback('tx')),
      assignUser: jest.fn(),
      unassignUser: jest.fn(),
      listAssignees: jest.fn(),
      createTaskHistory: jest.fn(),
      createNotification: jest.fn(),
    };
    access = {
      ensureTaskAccess: jest.fn(),
      ensureProjectAdminOrOwner: jest.fn(),
      ensureProjectMember: jest.fn(),
    };
    preferences = { isEnabled: jest.fn().mockResolvedValue(true) };
    assignmentMail = { sendTaskAssignedEmails: jest.fn() };
    service = new TaskAssigneeService(repository, access, preferences, assignmentMail);
  });

  it('lists assignees after ensuring task access', async () => {
    repository.listAssignees.mockResolvedValue([{ userId: 'user-2' }]);

    await expect(service.listAssignees('user-1', 'task-1')).resolves.toEqual([{ userId: 'user-2' }]);
    expect(access.ensureTaskAccess).toHaveBeenCalledWith('user-1', 'task-1');
  });

  it('assigns a user and emits history plus notification', async () => {
    repository.findTaskBasicById.mockResolvedValue({ id: 'task-1', projectId: 'project-1', title: 'Build' });
    repository.findAssignment.mockResolvedValue(null);
    repository.assignUser.mockResolvedValue({ taskId: 'task-1', userId: 'user-2' });

    await expect(service.assignUser('user-1', 'task-1', { userId: 'user-2' } as any)).resolves.toEqual({
      taskId: 'task-1',
      userId: 'user-2',
    });
    expect(repository.createNotification).toHaveBeenCalled();
    expect(assignmentMail.sendTaskAssignedEmails).toHaveBeenCalledWith({
      assigneeIds: ['user-2'],
      taskTitle: 'Build',
      projectName: undefined,
    });
  });

  it('rejects missing task and duplicate assignment', async () => {
    repository.findTaskBasicById.mockResolvedValue(null);
    await expect(service.assignUser('user-1', 'task-1', { userId: 'user-2' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.findTaskBasicById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    repository.findAssignment.mockResolvedValue({ taskId: 'task-1', userId: 'user-2' });
    await expect(service.assignUser('user-1', 'task-1', { userId: 'user-2' } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('unassigns existing assignment and rejects missing assignee', async () => {
    repository.findTaskBasicById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    repository.findAssignment.mockResolvedValue({ taskId: 'task-1', userId: 'user-2' });

    await expect(service.unassignUser('user-1', 'task-1', 'user-2')).resolves.toEqual({ success: true });
    expect(repository.unassignUser).toHaveBeenCalledWith('task-1', 'user-2', 'tx');

    repository.findAssignment.mockResolvedValue(null);
    await expect(service.unassignUser('user-1', 'task-1', 'user-2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
