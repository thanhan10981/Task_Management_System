import { VIETNAM_TIME_ZONE } from '../constants/app.constants';

export function formatDateTimeVietnam(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function getVietnamTimeZone(): string {
  return VIETNAM_TIME_ZONE;
}