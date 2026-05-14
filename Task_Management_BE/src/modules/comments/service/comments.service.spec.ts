import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: any;
  let access: any;
  let notifications: any;
  let preferences: any;

  beforeEach(() => {
    repository = {
      findTaskById: jest.fn(),
      findCommentById: jest.fn(),
      listTaskComments: jest.fn(),
      countTaskComments: jest.fn(),
      createComment: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
      createTaskHistory: jest.fn(),
    };
    access = {
      ensureTaskAccess: jest.fn(),
      ensureProjectMember: jest.fn().mockResolvedValue({ isOwner: false, role: 'DEVELOPER' }),
    };
    notifications = { create: jest.fn() };
    preferences = {
      filterEnabledUserIds: jest.fn().mockResolvedValue([]),
      isEnabled: jest.fn().mockResolvedValue(true),
    };
    service = new CommentsService(repository, access, notifications, preferences);
  });

  it('lists comments by task with pagination', async () => {
    repository.listTaskComments.mockResolvedValue([{ id: 'c1' }]);
    repository.countTaskComments.mockResolvedValue(1);

    await expect(service.listByTask('user-1', 'task-1', { page: 1, limit: 10 } as any)).resolves.toEqual({
      data: [{ id: 'c1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('creates comments and mention notifications', async () => {
    repository.findTaskById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    repository.createComment.mockResolvedValue({ id: 'c1', content: 'hi' });
    preferences.filterEnabledUserIds.mockResolvedValue(['user-2']);

    await expect(
      service.create('user-1', 'task-1', { content: 'hi', mentionIds: ['user-2'] } as any),
    ).resolves.toEqual({ id: 'c1', content: 'hi' });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-2' }));
  });

  it('rejects missing task and parent from another task', async () => {
    repository.findTaskById.mockResolvedValue(null);
    await expect(service.create('user-1', 'task-1', { content: 'hi' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.findTaskById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    repository.findCommentById.mockResolvedValue({ id: 'parent', taskId: 'task-2' });
    await expect(
      service.create('user-1', 'task-1', { content: 'hi', parentCommentId: 'parent' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates only owner comments', async () => {
    repository.findCommentById.mockResolvedValue({ id: 'c1', userId: 'user-1', taskId: 'task-1', content: 'old' });
    repository.findTaskById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    repository.updateComment.mockResolvedValue({ id: 'c1', content: 'new' });

    await expect(service.update('user-1', 'c1', { content: 'new' } as any)).resolves.toEqual({
      id: 'c1',
      content: 'new',
    });

    repository.findCommentById.mockResolvedValue({ id: 'c1', userId: 'user-2', taskId: 'task-1' });
    await expect(service.update('user-1', 'c1', { content: 'new' } as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('removes comments for owner/admin or author', async () => {
    repository.findCommentById.mockResolvedValue({ id: 'c1', userId: 'user-2', taskId: 'task-1', content: 'old' });
    repository.findTaskById.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
    access.ensureProjectMember.mockResolvedValue({ isOwner: true, role: 'OWNER' });

    await expect(service.remove('user-1', 'c1')).resolves.toEqual({ success: true });
    expect(repository.deleteComment).toHaveBeenCalledWith('c1');
  });
});
