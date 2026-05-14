import { TaskAnalyticsService } from './task-analytics.service';

describe('TaskAnalyticsService', () => {
  let repository: any;
  let service: TaskAnalyticsService;

  beforeEach(() => {
    repository = { findTasksForChart: jest.fn() };
    service = new TaskAnalyticsService(repository);
  });

  it('builds monthly chart buckets for a target year', async () => {
    repository.findTasksForChart.mockResolvedValue([
      { createdAt: new Date(2026, 0, 10), status: { isDone: false, name: 'To Do' } },
      { createdAt: new Date(2026, 0, 11), status: { isDone: true, name: 'Done' } },
      { createdAt: new Date(2026, 1, 1), status: { isDone: false, name: 'Complete' } },
    ]);

    const result = await service.getTaskChart('user-1', { period: 'monthly', month: '2026-01' } as any);

    expect(result.labels).toHaveLength(12);
    expect(result.totalSeries[0]).toBe(2);
    expect(result.completedSeries[0]).toBe(1);
    expect(result.completedSeries[1]).toBe(1);
    expect(result.summary).toEqual({ totalTasks: 3, completedTasks: 2, completionRate: 66.67 });
  });

  it('builds daily and weekly chart responses with empty data', async () => {
    repository.findTasksForChart.mockResolvedValue([]);

    await expect(service.getTaskChart('user-1', { period: 'daily', month: '2026-02' } as any)).resolves.toMatchObject({
      period: 'daily',
      labels: expect.arrayContaining(['01', '28']),
      summary: { totalTasks: 0, completedTasks: 0, completionRate: 0 },
    });

    await expect(service.getTaskChart('user-1', { period: 'weekly', month: '2026-05' } as any)).resolves.toMatchObject({
      period: 'weekly',
      labels: expect.arrayContaining(['W1']),
    });
  });
});
