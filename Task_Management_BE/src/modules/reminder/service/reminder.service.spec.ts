import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReminderService } from './reminder.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let repository: any;
  let mail: any;
  let config: any;
  let access: any;
  let preferences: any;

  const dueDate = new Date('2026-05-13T10:00:00.000Z');
  const task = {
    taskId: 'task-1',
    projectId: 'project-1',
    title: 'Ship',
    projectName: 'Octom',
    dueDate,
    assignees: [{ userId: 'user-2', email: 'dev@example.com', fullName: 'Dev' }],
  };

  beforeEach(() => {
    repository = {
      findDueTasksWithinMinutes: jest.fn(),
      findTaskForManualReminder: jest.fn(),
      tryReserveReminderNotification: jest.fn(),
      deleteNotificationById: jest.fn(),
    };
    mail = { sendTaskReminder: jest.fn() };
    config = { get: jest.fn().mockReturnValue('15,60,60,bad') };
    access = {
      ensureTaskAccess: jest.fn().mockResolvedValue('project-1'),
      ensureProjectMember: jest.fn().mockResolvedValue({ isOwner: true }),
    };
    preferences = { isEnabled: jest.fn().mockResolvedValue(true) };
    service = new ReminderService(repository, mail, config, access, preferences);
  });

  it('sends a manual reminder for owner and enabled assignee', async () => {
    repository.findTaskForManualReminder.mockResolvedValue(task);
    repository.tryReserveReminderNotification.mockResolvedValue('notification-1');

    await expect(service.sendTaskReminderNow('owner-1', 'task-1', 60)).resolves.toEqual({
      message: 'Reminder emails queued successfully',
      data: { taskId: 'task-1', sentCount: 1, skippedCount: 0 },
    });
    expect(mail.sendTaskReminder).toHaveBeenCalledWith(expect.objectContaining({ to: 'dev@example.com' }));
  });

  it('guards manual reminder access and task state', async () => {
    access.ensureProjectMember.mockResolvedValue({ isOwner: false });
    await expect(service.sendTaskReminderNow('user-1', 'task-1', 60)).rejects.toBeInstanceOf(ForbiddenException);

    access.ensureProjectMember.mockResolvedValue({ isOwner: true });
    repository.findTaskForManualReminder.mockResolvedValue(null);
    await expect(service.sendTaskReminderNow('owner-1', 'task-1', 60)).rejects.toBeInstanceOf(NotFoundException);

    repository.findTaskForManualReminder.mockResolvedValue({ ...task, assignees: [] });
    await expect(service.sendTaskReminderNow('owner-1', 'task-1', 60)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('runs cron thresholds and cleans reservation on mail failure', async () => {
    repository.findDueTasksWithinMinutes.mockResolvedValue([task]);
    repository.tryReserveReminderNotification.mockResolvedValue('notification-1');
    mail.sendTaskReminder.mockRejectedValue(new Error('SMTP down'));

    await service.handleTaskReminderCron();

    expect(repository.findDueTasksWithinMinutes).toHaveBeenCalledTimes(2);
    expect(repository.deleteNotificationById).toHaveBeenCalledWith('notification-1');
  });
});
