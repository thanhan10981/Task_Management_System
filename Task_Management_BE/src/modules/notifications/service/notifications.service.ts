import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { NotificationQueryDto } from '../dto/notification.dto';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async listForCurrentUser(userId: string, queryDto: NotificationQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);
    const where = queryDto.type ? { type: queryDto.type } : {};

    const [notifications, total] = await Promise.all([
      this.notificationsRepository.listByUserId(userId, where, skip, take),
      this.notificationsRepository.countByUserId(userId, where),
    ]);

    return createPaginatedResponse(notifications, total, queryDto);
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot mark another user notification');
    }

    return this.notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async remove(userId: string, id: string) {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user notification');
    }

    await this.notificationsRepository.deleteById(id);
    return { success: true };
  }

  // Notification creation is intentionally excluded from public APIs.
  // Notifications are produced by domain side effects (task/comment/project actions).
}
