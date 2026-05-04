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
    const projectId = queryDto.projectId;

    // Parse target date from `month` param (YYYY-MM) or fall back to now
    const targetDate = this.parseTargetDate(queryDto.month);
    const buckets = this.buildChartBuckets(period, targetDate);

    const tasks = await this.taskAnalyticsRepository.findTasksForChart(
      userId,
      buckets[0].start,
      buckets[buckets.length - 1].end,
      projectId,
    );

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
      if (this.isTaskDone(task)) {
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

  private isTaskDone(task: TaskChartTaskRow): boolean {
    if (task.status.isDone) {
      return true;
    }

    return /done|complete/i.test(task.status.name);
  }

  /**
   * Parse YYYY-MM string into a Date object (1st of that month).
   * Falls back to `new Date()` when the string is missing or invalid.
   */
  private parseTargetDate(month?: string): Date {
    if (!month) return new Date();
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monthStr, 10) - 1; // 0-indexed
    if (Number.isNaN(year) || Number.isNaN(mon)) return new Date();
    return new Date(year, mon, 1);
  }

  private buildChartBuckets(period: TaskChartPeriod, targetDate: Date): TaskChartBucket[] {
    if (period === 'monthly') {
      // Monthly always shows 12 months of the target year
      return this.buildYearBuckets(targetDate);
    }

    if (period === 'weekly') {
      return this.buildMonthWeekBuckets(targetDate);
    }

    return this.buildMonthDailyBuckets(targetDate);
  }

  private buildMonthDailyBuckets(date: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const d = new Date(year, month, day);

      const start = this.startOfDay(d);
      const end = this.endOfDay(d);

      buckets.push({
        key: this.toDateKey(d),
        label: this.formatDayOfMonthLabel(d),
        start,
        end,
      });
    }

    return buckets;
  }

  private buildMonthWeekBuckets(date: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

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

  private buildYearBuckets(date: Date): TaskChartBucket[] {
    const buckets: TaskChartBucket[] = [];
    const year = date.getFullYear();

    for (let month = 0; month < 12; month++) {
      const d = new Date(year, month, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      buckets.push({
        key: this.toMonthKey(d),
        label: this.formatMonthLabel(d),
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
}

