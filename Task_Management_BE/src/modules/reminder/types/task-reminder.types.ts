export interface TaskReminderAssignee {
  userId: string;
  email: string;
  fullName: string;
}

export interface TaskReminderTask {
  taskId: string;
  title: string;
  dueDate: Date;
  projectId: string;
  projectName?: string;
  assignees: TaskReminderAssignee[];
}

export interface SaveReminderNotificationInput {
  userId: string;
  projectId?: string;
  title: string;
  content: string;
  data: {
    reminderKey: string;
    taskId: string;
    thresholdMinutes: number;
    dueDate: string;
    dueDateVietnam?: string;
  };
}
