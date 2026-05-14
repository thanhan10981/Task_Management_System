import {
  DEFAULT_MAIL_FROM_ADDRESS,
  DEFAULT_MAIL_FROM_NAME,
} from '../constants/app.constants';
import { buildMailFrom } from './mail-from.helper';

describe('buildMailFrom', () => {
  it('builds sender from public values', () => {
    expect(buildMailFrom('Octom', 'noreply@example.com')).toBe(
      'Octom <noreply@example.com>',
    );
  });

  it('falls back to defaults when values are blank', () => {
    expect(buildMailFrom('  ', '')).toBe(
      `${DEFAULT_MAIL_FROM_NAME} <${DEFAULT_MAIL_FROM_ADDRESS}>`,
    );
  });
});
