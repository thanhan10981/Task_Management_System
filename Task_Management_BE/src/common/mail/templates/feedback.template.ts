type FeedbackTemplateInput = {
  type: string;
  subject?: string;
  message: string;
  pageUrl?: string;
  projectId?: string;
  projectName?: string;
  clientInfo?: string;
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
};

const labelByType: Record<string, string> = {
  ui: 'UI feedback',
  bug: 'Bug report',
  feature: 'Feature request',
  other: 'Other feedback',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optionalLine(label: string, value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? `- ${label}: ${normalized}` : null;
}

export const feedbackTemplate = ({
  type,
  subject,
  message,
  pageUrl,
  projectId,
  projectName,
  clientInfo,
  user,
}: FeedbackTemplateInput) => {
  const feedbackType = labelByType[type] ?? labelByType.other;
  const normalizedSubject = subject?.trim();
  const mailSubject = normalizedSubject
    ? `[OCTOM Feedback] ${feedbackType}: ${normalizedSubject}`
    : `[OCTOM Feedback] ${feedbackType}`;

  const details = [
    `- Type: ${feedbackType}`,
    optionalLine('Subject', normalizedSubject),
    optionalLine('Page', pageUrl),
    optionalLine('Project', projectName),
    optionalLine('Project ID', projectId),
    optionalLine('Browser', clientInfo),
  ].filter(Boolean) as string[];

  const userLines = [
    `- User ID: ${user.id}`,
    optionalLine('Name', user.fullName),
    optionalLine('Email', user.email),
  ].filter(Boolean) as string[];

  return {
    subject: mailSubject,
    text: [
      'New feedback was submitted from OCTOM.',
      '',
      'Feedback',
      ...details,
      '',
      'Submitted by',
      ...userLines,
      '',
      'Message',
      message,
    ].join('\n'),
    html: `
      <p>New feedback was submitted from OCTOM.</p>
      <h3>Feedback</h3>
      <ul>
        ${details.map((line) => `<li>${escapeHtml(line.replace(/^- /, ''))}</li>`).join('')}
      </ul>
      <h3>Submitted by</h3>
      <ul>
        ${userLines.map((line) => `<li>${escapeHtml(line.replace(/^- /, ''))}</li>`).join('')}
      </ul>
      <h3>Message</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    `,
  };
};
