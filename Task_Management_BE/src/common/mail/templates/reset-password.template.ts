export const resetPasswordTemplate = (
  userName: string,
  resetLink: string,
  expiresInMinutes: number,
) => ({
  subject: 'Password Reset Link',
  text: [
    `Dear ${userName},`,
    '',
    'We received a request to reset your account password.',
    `Please use this link to reset your password: ${resetLink}`,
    `This reset link will expire in ${expiresInMinutes} minutes.`,
    '',
    'If you did not make this request, please ignore this email.',
    '',
    'Best regards,',
    'Task Management Team',
  ].join('\n'),
  html: `
    <p>Dear ${userName},</p>
    <p>We received a request to reset your account password.</p>
    <p>
      Click the link below to reset your password:<br/>
      <a href="${resetLink}">${resetLink}</a>
    </p>
    <p>This reset link will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
    <p>If you did not make this request, please ignore this email.</p>
    <p>Best regards,<br/>Task Management Team</p>
  `,
});