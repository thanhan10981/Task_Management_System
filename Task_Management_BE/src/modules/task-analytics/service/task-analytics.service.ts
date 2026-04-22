import { Injectable } from '@nestjs/common';
import { TaskChartQueryDto } from '../dto/task-chart-query.dto';
import {
  DEFAULT_TASK_CHART_PERIOD,
} from '../constants/task-chart.constants';
import {
  TaskChartBucket,
  TaskChartPeriod,
  TaskChartResponse,
  TaskChartSeriesItem,
  TaskChartTaskRow,
} from '../types/task-chart.types';
import { TaskAnalyticsRepository } from '../repository/task-analytics.repository';

@Injectable()
export class TaskAnalyticsService {
  constructor(private readonly taskAnalyticsRepository: TaskAnalyticsRepository) {}

  async getTaskChart(userId: string, queryDto: TaskChartQueryDto): Promise<TaskChartResponse> {
    const period = queryDto.period ?? DEFAULT_TASK_CHART_PERIOD;
    const now = new Date();
    const buckets = this.buildChartBuckets(period, now);

    const [tasks, doneStatuses] = await Promise.all([
      this.taskAnalyticsRepository.findTasksForChart(
        userId,
        buckets[0].start,
        buckets[buckets.length - 1].end,
      ),
      this.taskAnalyticsRepository.findDoneStatusIdsForUserProjects(userId),
    ]);
    const doneStatusIdSet = new Set(doneStatuses.map((status) => status.id));

    const series: TaskChartSeriesItem[] = buckets.map((bucket) => ({
      key: bucket.key,
      total: 0,
      completed: 0,
    }));

    for (const task of tasks) {
      const index = buckets.findIndex(
        (bucket) => task.createdAt >= bucket.start && task.createdAt <= bucket.end,
      );

      if (index < 0) {
        continue;
      }

      series[index].total += 1;
      if (this.isTaskDone(task, doneStatusIdSet)) {
        series[index].completed += 1;
      }
    }

    const totalTasks = series.reduce((sum, item) => sum + item.total, 0);
    const completedTasks = series.reduce((sum, item) => sum + item.completed, 0);

    return {
      period,
      labels: buckets.map((bucket) => bucket.label),
      totalSeries: series.map((item) => item.total),
      completedSeries: series.map((item) => item.completed),
      summary: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks
          ? Number(((completedTasks / totalTasks) * 100).toFixed(2))
          : 0,
      },
    };
  }

  private buildChartBuckets(period: TaskChartPeriod, now: Date): TaskChartBucket[] {
    if (period === 'monthly') {
      return this.buildCurrentYearBuckets(now);
    }

    if (period === 'weekly') {
      return this.buildCurrentMonthWeekBuckets(now);
    }

    return this.buildCurrentMonthDailyBuckets(now);
  }

  private buildCurrentMonthDailyBuckets(now: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const date = new Date(year, month, day);

      const start = this.startOfDay(date);
      const end = this.endOfDay(date);

      buckets.push({
        key: this.toDateKey(date),
        label: this.formatDayOfMonthLabel(date),
        start,
        end,
      });
    }

    return buckets;
  }

  private buildCurrentMonthWeekBuckets(now: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let cursor = this.startOfWeekMonday(monthStart);
    let weekIndex = 1;

    while (cursor <= monthEnd) {
      const weekStart = this.startOfDay(cursor);
      const weekEnd = this.endOfDay(this.addDays(cursor, 6));

      const start = weekStart < monthStart ? monthStart : weekStart;
      const end = weekEnd > monthEnd ? monthEnd : weekEnd;

      buckets.push({
        key: `${this.toMonthKey(monthStart)}-w${weekIndex}`,
        label: `W${weekIndex}`,
        start,
        end,
      });

      cursor = this.addDays(cursor, 7);
      weekIndex += 1;
    }

    return buckets;
  }

  private buildCurrentYearBuckets(now: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const year = now.getFullYear();

    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      buckets.push({
        key: this.toMonthKey(date),
        label: this.formatMonthLabel(date),
        start,
        end,
      });
    }

    return buckets;
  }

  private startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private startOfWeekMonday(date: Date): Date {
    const start = this.startOfDay(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return start;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  }

  private formatDayOfMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
    }).format(date);
  }

  private formatMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
    }).format(date);
  }

  private isTaskDone(task: TaskChartTaskRow, doneStatusIdSet: ReadonlySet<string>): boolean {
    return doneStatusIdSet.has(task.statusId);
  }
}
