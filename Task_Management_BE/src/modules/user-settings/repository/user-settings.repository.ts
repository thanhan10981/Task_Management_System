import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ThemeMode } from '@prisma/client';

interface UserSettingsPayload {
  language?: string;
  timezone?: string;
  theme?: ThemeMode;
  notificationSettings?: Record<string, unknown>;
  privacySettings?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

@Injectable()
export class UserSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  upsertByUserId(userId: string, data: UserSettingsPayload) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        language: data.language,
        timezone: data.timezone,
        theme: data.theme,
        notificationSettings: data.notificationSettings as any,
        privacySettings: data.privacySettings as any,
        preferences: data.preferences as any,
      },
      create: {
        userId,
        language: data.language,
        timezone: data.timezone,
        theme: data.theme,
        notificationSettings: data.notificationSettings as any,
        privacySettings: data.privacySettings as any,
        preferences: data.preferences as any,
      },
    });
  }
}
