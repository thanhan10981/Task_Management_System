import { ReminderController } from './reminder.controller';

describe('ReminderController', () => {
  it('forwards manual reminder request with current user id', () => {
    const service = { sendTaskReminderNow: jest.fn() };
    const controller = new ReminderController(service as any);

    controller.sendTaskReminderNow(
      { user: { id: 'user-1' } } as any,
      'task-1',
      { thresholdMinutes: 60 } as any,
    );

    expect(service.sendTaskReminderNow).toHaveBeenCalledWith('user-1', 'task-1', 60);
  });
});
