export class TaskReminderMailDto {
  to: string;
  recipientName: string;
  taskTitle: string;
  dueDate: Date;
  projectName?: string;
  thresholdMinutes: number;
}
