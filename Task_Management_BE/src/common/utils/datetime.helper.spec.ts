import { VIETNAM_TIME_ZONE } from '../constants/app.constants';
import { formatDateTimeVietnam, getVietnamTimeZone } from './datetime.helper';

describe('datetime.helper', () => {
  it('returns the configured Vietnam timezone', () => {
    expect(getVietnamTimeZone()).toBe(VIETNAM_TIME_ZONE);
  });

  it('formats dates in Vietnam locale and timezone', () => {
    const date = new Date('2026-05-13T15:00:00.000Z');
    expect(formatDateTimeVietnam(date)).toContain('13/05/2026');
  });
});
