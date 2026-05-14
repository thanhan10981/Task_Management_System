import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  it('forwards current user notification calls', () => {
    const service = {
      listForCurrentUser: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new NotificationsController(service as any);
    const req = { user: { id: 'user-1' } };

    controller.list(req, { page: 1 } as any);
    controller.markAsRead(req, 'n1');
    controller.markAllAsRead(req);
    controller.remove(req, 'n1');

    expect(service.listForCurrentUser).toHaveBeenCalledWith('user-1', { page: 1 });
    expect(service.markAsRead).toHaveBeenCalledWith('user-1', 'n1');
    expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
    expect(service.remove).toHaveBeenCalledWith('user-1', 'n1');
  });
});
