export type TaskChartPeriod = 'daily' | 'weekly' | 'monthly';

export type TaskChartTaskRow = {
  createdAt: Date;
  statusId: string;
};

export type TaskChartBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

export type TaskChartSeriesItem = {
  key: string;
  total: number;
  completed: number;
};

export type TaskChartResponse = {
  period: TaskChartPeriod;
  labels: string[];
  totalSeries: number[];
  completedSeries: number[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
};
