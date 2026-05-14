import { CommentsController } from './comments.controller';

describe('CommentsController', () => {
  it('forwards task scoped comment calls with current user id', () => {
    const service = {
      listByTask: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new CommentsController(service as any);
    const req = { user: { id: 'user-1' } };

    controller.listByTask(req, 'task-1', { page: 1 } as any);
    controller.create(req, 'task-1', { content: 'Hi' } as any);
    controller.update(req, 'comment-1', { content: 'New' } as any);
    controller.remove(req, 'comment-1');

    expect(service.listByTask).toHaveBeenCalledWith('user-1', 'task-1', { page: 1 });
    expect(service.create).toHaveBeenCalledWith('user-1', 'task-1', { content: 'Hi' });
    expect(service.update).toHaveBeenCalledWith('user-1', 'comment-1', { content: 'New' });
    expect(service.remove).toHaveBeenCalledWith('user-1', 'comment-1');
  });
});
