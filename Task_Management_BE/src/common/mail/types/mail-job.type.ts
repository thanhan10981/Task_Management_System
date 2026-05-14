export type MailJob = {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
};
