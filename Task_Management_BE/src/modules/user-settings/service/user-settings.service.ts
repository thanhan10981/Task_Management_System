import { Injectable } from '@nestjs/common';
import { UserSettingsRepository } from '../repository/user-settings.repository';
import { UpdateUserSettingsDto } from '../dto/user-settings.dto';

@Injectable()
export class UserSettingsService {
  constructor(private readonly userSettingsRepository: UserSettingsRepository) {}

  async getCurrentSettings(userId: string) {
    // User settings are intentionally non-CRUD and scoped to current user.
    return this.userSettingsRepository.upsertByUserId(userId, {});
  }

  async updateCurrentSettings(userId: string, dto: UpdateUserSettingsDto) {
    // No create/delete endpoints are exposed; settings lifecycle is user-owned.
    return this.userSettingsRepository.upsertByUserId(userId, {
      theme: dto.theme,
      notificationSettings: dto.notificationSettings,
      privacySettings: dto.privacySettings,
      preferences: dto.preferences,
    });
  }
}
