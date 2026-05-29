export type TaskChartPeriod = 'daily' | 'weekly' | 'monthly';

export type TaskChartTaskRow = {
  createdAt: Date;
  status: {
    isDone: boolean;
    name: string;
  };
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

export type TaskReportTaskRow = {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  updatedAt: Date;
  status: {
    name: string;
    color: string | null;
    isDone: boolean;
  };
  project: {
    id: string;
    name: string;
  };
  sprint: {
    id: string;
    name: string;
  } | null;
  assignees: Array<{
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
};

export type TaskReportMemberRow = {
  id: string;
  role: string;
  userId: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type TaskReportResponse = {
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  taskByStatus: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  taskByPriority: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  sprintProgress: Array<{
    id: string;
    name: string;
    total: number;
    done: number;
    remaining: number;
  }>;
  completionChart: {
    period: TaskChartPeriod;
    labels: string[];
    completedSeries: number[];
  };
  overdueTasks: Array<{
    id: string;
    title: string;
    assignee: string;
    priority: string;
    dueDate: string;
    status: string;
    project: string;
  }>;
  memberPerformance: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assigned: number;
    completed: number;
    overdue: number;
    rate: number;
  }>;
  generatedAt: string;
};
