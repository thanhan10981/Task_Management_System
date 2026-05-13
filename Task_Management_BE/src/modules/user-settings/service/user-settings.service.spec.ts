import { UserSettingsService } from './user-settings.service';

describe('UserSettingsService', () => {
  it('upserts current user settings on read and update', async () => {
    const repository = { upsertByUserId: jest.fn().mockResolvedValue({ userId: 'user-1' }) };
    const service = new UserSettingsService(repository as any);

    await expect(service.getCurrentSettings('user-1')).resolves.toEqual({ userId: 'user-1' });
    expect(repository.upsertByUserId).toHaveBeenCalledWith('user-1', {});

    const dto = {
      theme: 'dark',
      notificationSettings: { email: true },
      privacySettings: { profile: 'team' },
      preferences: { density: 'compact' },
    };
    await service.updateCurrentSettings('user-1', dto as any);

    expect(repository.upsertByUserId).toHaveBeenLastCalledWith('user-1', dto);
  });
});
