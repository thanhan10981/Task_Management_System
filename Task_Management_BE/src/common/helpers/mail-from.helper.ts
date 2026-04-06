const DEFAULT_MAIL_FROM_NAME = 'Task Management';
const DEFAULT_MAIL_FROM_ADDRESS = 'no-reply@task.local';

export const buildMailFrom = (
  publicName?: string,
  publicAddress?: string,
): string => {
  const normalizedName = publicName?.trim() || DEFAULT_MAIL_FROM_NAME;
  const normalizedAddress = publicAddress?.trim() || DEFAULT_MAIL_FROM_ADDRESS;

  return `${normalizedName} <${normalizedAddress}>`;
};