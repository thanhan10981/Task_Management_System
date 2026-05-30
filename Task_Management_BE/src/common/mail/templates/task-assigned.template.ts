type TaskAssignedTemplateInput = {
  recipientName: string;
  taskTitle: string;
  projectName?: string | null;
};

export const taskAssignedTemplate = ({
  recipientName,
  taskTitle,
  projectName,
}: TaskAssignedTemplateInput) => ({
  subject: 'You were assigned to a task',
  text: [
    `Dear ${recipientName},`,
    '',
    'You have been assigned to a task:',
    `- Task: ${taskTitle}`,
    `- Project: ${projectName ?? 'N/A'}`,
    '',
    'Please open the task board to review the details.',
    '',
    'Best regards,',
    'Task Management Team',
  ].join('\n'),
  html: `
    <p>Dear ${recipientName},</p>
    <p>You have been assigned to a task:</p>
    <ul>
      <li><strong>Task:</strong> ${taskTitle}</li>
      <li><strong>Project:</strong> ${projectName ?? 'N/A'}</li>
    </ul>
    <p>Please open the task board to review the details.</p>
    <p>Best regards,<br/>Task Management Team</p>
  `,
});
