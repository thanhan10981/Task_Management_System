import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPreferenceKey } from './notification-preferences.constants';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(userId: string, key: NotificationPreferenceKey): Promise<boolean> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { notificationSettings: true },
    });

    const notificationSettings = settings?.notificationSettings;
    if (!notificationSettings || typeof notificationSettings !== 'object') {
      return true;
    }

    const value = (notificationSettings as Record<string, unknown>)[key];
    return typeof value === 'boolean' ? value : true;
  }

  async filterEnabledUserIds(
    userIds: string[],
    key: NotificationPreferenceKey,
  ): Promise<string[]> {
    const uniqueUserIds = Array.from(new Set(userIds));
    const enabled = await Promise.all(
      uniqueUserIds.map(async (userId) => ({
        userId,
        enabled: await this.isEnabled(userId, key),
      })),
    );

    return enabled.filter((item) => item.enabled).map((item) => item.userId);
  }
}
