import {
  DEFAULT_MAIL_FROM_ADDRESS,
  DEFAULT_MAIL_FROM_NAME,
} from '../constants/app.constants';

export const buildMailFrom = (
  publicName?: string,
  publicAddress?: string,
): string => {
  const normalizedName = publicName?.trim() || DEFAULT_MAIL_FROM_NAME;
  const normalizedAddress = publicAddress?.trim() || DEFAULT_MAIL_FROM_ADDRESS;

  return `${normalizedName} <${normalizedAddress}>`;
};