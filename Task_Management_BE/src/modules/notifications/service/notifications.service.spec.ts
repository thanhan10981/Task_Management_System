import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: any;

  beforeEach(() => {
    repository = {
      listByUserId: jest.fn(),
      countByUserId: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteById: jest.fn(),
    };
    service = new NotificationsService(repository);
  });

  it('lists current user notifications with filters and pagination', async () => {
    repository.listByUserId.mockResolvedValue([{ id: 'n1' }]);
    repository.countByUserId.mockResolvedValue(1);

    await expect(
      service.listForCurrentUser('user-1', { page: 2, limit: 5, type: 'SYSTEM' } as any),
    ).resolves.toEqual({
      data: [{ id: 'n1' }],
      meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });
    expect(repository.listByUserId).toHaveBeenCalledWith('user-1', { type: 'SYSTEM' }, 5, 5);
  });

  it('marks own notification as read', async () => {
    repository.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
    repository.markAsRead.mockResolvedValue({ id: 'n1', isRead: true });

    await expect(service.markAsRead('user-1', 'n1')).resolves.toEqual({ id: 'n1', isRead: true });
  });

  it('rejects missing or foreign notifications', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.markAsRead('user-1', 'n1')).rejects.toBeInstanceOf(NotFoundException);

    repository.findById.mockResolvedValue({ id: 'n1', userId: 'user-2' });
    await expect(service.remove('user-1', 'n1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks all as read and deletes own notification', async () => {
    repository.markAllAsRead.mockResolvedValue({ count: 3 });
    await expect(service.markAllAsRead('user-1')).resolves.toEqual({ count: 3 });

    repository.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
    await expect(service.remove('user-1', 'n1')).resolves.toEqual({ success: true });
    expect(repository.deleteById).toHaveBeenCalledWith('n1');
  });
});
