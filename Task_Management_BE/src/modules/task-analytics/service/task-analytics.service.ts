import { Injectable } from '@nestjs/common';
import { TaskChartQueryDto } from '../dto/task-chart-query.dto';
import { TaskReportQueryDto } from '../dto/task-report-query.dto';
import {
  DEFAULT_TASK_CHART_PERIOD,
} from '../constants/task-chart.constants';
import {
  TaskChartBucket,
  TaskChartPeriod,
  TaskChartResponse,
  TaskChartSeriesItem,
  TaskChartTaskRow,
  TaskReportMemberRow,
  TaskReportResponse,
  TaskReportTaskRow,
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

  async getTaskReport(userId: string, queryDto: TaskReportQueryDto): Promise<TaskReportResponse> {
    const period = queryDto.period ?? DEFAULT_TASK_CHART_PERIOD;
    const targetDate = this.parseTargetDate(queryDto.month);
    const buckets = this.buildChartBuckets(period, targetDate);

    const [tasks, members] = await Promise.all([
      this.taskAnalyticsRepository.findTasksForReport(
        userId,
        queryDto.projectId,
        queryDto.sprintId,
      ),
      this.taskAnalyticsRepository.findMembersForReport(userId, queryDto.projectId),
    ]);

    const visibleTasks = tasks as TaskReportTaskRow[];
    const visibleMembers = members as TaskReportMemberRow[];
    const totalTasks = visibleTasks.length;
    const completedTasks = visibleTasks.filter((task) => this.isReportTaskDone(task)).length;
    const overdueTasks = visibleTasks.filter((task) => this.isReportTaskOverdue(task)).length;

    return {
      summary: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks
          ? Number(((completedTasks / totalTasks) * 100).toFixed(2))
          : 0,
      },
      taskByStatus: this.buildTaskByStatus(visibleTasks),
      taskByPriority: this.buildTaskByPriority(visibleTasks),
      sprintProgress: this.buildSprintProgress(visibleTasks),
      completionChart: this.buildCompletionChart(visibleTasks, buckets, period),
      overdueTasks: this.buildOverdueTasks(visibleTasks),
      memberPerformance: this.buildMemberPerformance(visibleTasks, visibleMembers),
      generatedAt: new Date().toISOString(),
    };
  }

  private isTaskDone(task: TaskChartTaskRow): boolean {
    if (task.status.isDone) {
      return true;
    }

    return /done|complete/i.test(task.status.name);
  }

  private isReportTaskDone(task: TaskReportTaskRow): boolean {
    if (task.status.isDone) return true;
    return /done|complete/i.test(task.status.name);
  }

  private isReportTaskOverdue(task: TaskReportTaskRow): boolean {
    if (!task.dueDate || this.isReportTaskDone(task)) return false;
    return task.dueDate.getTime() < this.startOfDay(new Date()).getTime();
  }

  private buildTaskByStatus(tasks: TaskReportTaskRow[]): TaskReportResponse['taskByStatus'] {
    const map = new Map<string, { label: string; count: number; color: string }>();

    for (const task of tasks) {
      const label = task.status.name || 'Unknown';
      const current = map.get(label) ?? {
        label,
        count: 0,
        color: task.status.color || '#94a3b8',
      };
      current.count += 1;
      map.set(label, current);
    }

    return [...map.values()].sort((a, b) => b.count - a.count);
  }

  private buildTaskByPriority(tasks: TaskReportTaskRow[]): TaskReportResponse['taskByPriority'] {
    const colors: Record<string, string> = {
      URGENT: '#ef4444',
      HIGH: '#f59e0b',
      MEDIUM: '#6366f1',
      LOW: '#10b981',
    };
    const labels = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    const counts = new Map<string, number>();

    for (const task of tasks) {
      counts.set(task.priority, (counts.get(task.priority) ?? 0) + 1);
    }

    return labels
      .map((priority) => ({
        label: this.toTitleCase(priority),
        count: counts.get(priority) ?? 0,
        color: colors[priority] ?? '#94a3b8',
      }))
      .filter((item) => item.count > 0);
  }

  private buildSprintProgress(tasks: TaskReportTaskRow[]): TaskReportResponse['sprintProgress'] {
    const map = new Map<string, { id: string; name: string; total: number; done: number }>();

    for (const task of tasks) {
      const id = task.sprint?.id ?? '__backlog';
      const current = map.get(id) ?? {
        id,
        name: task.sprint?.name ?? 'Backlog',
        total: 0,
        done: 0,
      };
      current.total += 1;
      if (this.isReportTaskDone(task)) current.done += 1;
      map.set(id, current);
    }

    return [...map.values()]
      .map((sprint) => ({
        ...sprint,
        remaining: Math.max(0, sprint.total - sprint.done),
      }))
      .sort((a, b) => b.total - a.total);
  }

  private buildCompletionChart(
    tasks: TaskReportTaskRow[],
    buckets: TaskChartBucket[],
    period: TaskChartResponse['period'],
  ): TaskReportResponse['completionChart'] {
    const completedSeries = buckets.map(() => 0);

    for (const task of tasks) {
      if (!this.isReportTaskDone(task)) continue;

      const index = buckets.findIndex(
        (bucket) => task.updatedAt >= bucket.start && task.updatedAt <= bucket.end,
      );

      if (index >= 0) {
        completedSeries[index] += 1;
      }
    }

    return {
      period,
      labels: buckets.map((bucket) => bucket.label),
      completedSeries,
    };
  }

  private buildOverdueTasks(tasks: TaskReportTaskRow[]): TaskReportResponse['overdueTasks'] {
    return tasks
      .filter((task) => this.isReportTaskOverdue(task))
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .map((task) => ({
        id: task.id,
        title: task.title,
        assignee: task.assignees.map((assignee) => assignee.user.fullName).join(', ') || 'Unassigned',
        priority: this.toTitleCase(task.priority),
        dueDate: task.dueDate ? task.dueDate.toISOString() : '',
        status: task.status.name,
        project: task.project.name,
      }));
  }

  private buildMemberPerformance(
    tasks: TaskReportTaskRow[],
    members: TaskReportMemberRow[],
  ): TaskReportResponse['memberPerformance'] {
    const memberMap = new Map<string, TaskReportResponse['memberPerformance'][number]>();

    for (const member of members) {
      memberMap.set(`${member.projectId}:${member.userId}`, {
        id: `${member.projectId}:${member.userId}`,
        name: member.user.fullName,
        email: member.user.email,
        role: this.toTitleCase(member.role),
        assigned: 0,
        completed: 0,
        overdue: 0,
        rate: 0,
      });
    }

    for (const task of tasks) {
      for (const assignee of task.assignees) {
        const key = `${task.project.id}:${assignee.userId}`;
        const current = memberMap.get(key);
        if (!current) continue;

        current.assigned += 1;
        if (this.isReportTaskDone(task)) current.completed += 1;
        if (this.isReportTaskOverdue(task)) current.overdue += 1;
      }
    }

    return [...memberMap.values()]
      .map((member) => ({
        ...member,
        rate: member.assigned ? Math.round((member.completed / member.assigned) * 100) : 0,
      }))
      .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name));
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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

