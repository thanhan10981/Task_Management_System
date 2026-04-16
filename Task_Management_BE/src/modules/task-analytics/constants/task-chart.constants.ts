import { TaskChartPeriod } from '../types/task-chart.types';

export const TASK_CHART_PERIODS = ['daily', 'weekly', 'monthly'] as const;

export const DEFAULT_TASK_CHART_PERIOD: TaskChartPeriod = 'monthly';
