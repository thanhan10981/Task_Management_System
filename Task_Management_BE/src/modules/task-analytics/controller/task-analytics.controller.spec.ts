import { TaskAnalyticsController } from './task-analytics.controller';

describe('TaskAnalyticsController', () => {
  it('forwards chart query with current user id', () => {
    const service = { getTaskChart: jest.fn() };
    const controller = new TaskAnalyticsController(service as any);

    controller.getTaskChart({ user: { id: 'user-1' } } as any, { period: 'daily' } as any);

    expect(service.getTaskChart).toHaveBeenCalledWith('user-1', { period: 'daily' });
  });
});
