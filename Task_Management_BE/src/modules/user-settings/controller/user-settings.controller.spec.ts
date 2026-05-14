import { UserSettingsController } from './user-settings.controller';

describe('UserSettingsController', () => {
  it('forwards current-user settings calls', () => {
    const service = {
      getCurrentSettings: jest.fn(),
      updateCurrentSettings: jest.fn(),
    };
    const controller = new UserSettingsController(service as any);
    const req = { user: { id: 'user-1' } };

    controller.getCurrent(req);
    controller.updateCurrent(req, { theme: 'dark' } as any);

    expect(service.getCurrentSettings).toHaveBeenCalledWith('user-1');
    expect(service.updateCurrentSettings).toHaveBeenCalledWith('user-1', { theme: 'dark' });
  });
});
