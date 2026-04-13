import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  listByUserId(userId: string, where: Prisma.NotificationWhereInput, skip: number, take: number) {
    return this.prisma.notification.findMany({
      where: {
        ...where,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countByUserId(userId: string, where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({
      where: {
        ...where,
        userId,
      },
    });
  }

  markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  deleteById(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
}
