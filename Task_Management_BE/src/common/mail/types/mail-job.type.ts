import { SendMailOptions } from 'nodemailer';

export type MailJob = {
  options: SendMailOptions;
  attempts: number;
};