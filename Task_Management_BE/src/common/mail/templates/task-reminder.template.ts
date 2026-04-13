type TaskReminderTemplateInput = {
  recipientName: string;
  taskTitle: string;
  projectName?: string | null;
  dueDateDisplay: string;
  thresholdMinutes: number;
};

export const taskReminderTemplate = ({
  recipientName,
  taskTitle,
  projectName,
  dueDateDisplay,
  thresholdMinutes,
}: TaskReminderTemplateInput) => ({
  subject: 'Task Deadline Reminder',
  text: [
    `Dear ${recipientName},`,
    '',
    'This is a friendly reminder that the following task is approaching its deadline:',
    `- Task: ${taskTitle}`,
    `- Project: ${projectName ?? 'N/A'}`,
    `- Due date (Vietnam time): ${dueDateDisplay}`,
    `- Reminder threshold: ${thresholdMinutes} minutes`,
    '',
    'Please review and complete the task on time.',
    '',
    'Best regards,',
    'Task Management Team',
  ].join('\n'),
  html: `
    <p>Dear ${recipientName},</p>
    <p>This is a friendly reminder that the following task is approaching its deadline:</p>
    <ul>
      <li><strong>Task:</strong> ${taskTitle}</li>
      <li><strong>Project:</strong> ${projectName ?? 'N/A'}</li>
      <li><strong>Due date (Vietnam time):</strong> ${dueDateDisplay}</li>
      <li><strong>Reminder threshold:</strong> ${thresholdMinutes} minutes</li>
    </ul>
    <p>Please review and complete the task on time.</p>
    <p>Best regards,<br/>Task Management Team</p>
  `,
});