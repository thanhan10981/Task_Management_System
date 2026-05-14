import { NotificationPreferencesService } from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  let prisma: any;
  let service: NotificationPreferencesService;

  beforeEach(() => {
    prisma = { userSettings: { findUnique: jest.fn() } };
    service = new NotificationPreferencesService(prisma);
  });

  it('defaults to enabled when settings are missing or malformed', async () => {
    prisma.userSettings.findUnique.mockResolvedValue(null);
    await expect(service.isEnabled('user-1', 'task-assign')).resolves.toBe(true);

    prisma.userSettings.findUnique.mockResolvedValue({ notificationSettings: 'bad' });
    await expect(service.isEnabled('user-1', 'task-assign')).resolves.toBe(true);
  });

  it('reads boolean preference values and filters unique enabled users', async () => {
    prisma.userSettings.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve({
        notificationSettings: {
          mentions: where.userId !== 'user-2',
        },
      }),
    );

    await expect(service.isEnabled('user-1', 'mentions')).resolves.toBe(true);
    await expect(service.isEnabled('user-2', 'mentions')).resolves.toBe(false);
    await expect(service.filterEnabledUserIds(['user-1', 'user-1', 'user-2'], 'mentions')).resolves.toEqual([
      'user-1',
    ]);
  });
});
