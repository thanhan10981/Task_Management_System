import { buildTaskHistoryMetadata } from './task-history.util';

describe('buildTaskHistoryMetadata', () => {
  it('normalizes dates, nested objects, arrays, and nullish values', () => {
    const date = new Date('2026-05-13T00:00:00.000Z');

    expect(
      buildTaskHistoryMetadata({
        dueDate: { old: null, new: date },
        tags: { old: ['a', undefined], new: { keep: true, drop: undefined } },
      }),
    ).toEqual({
      dueDate: { old: null, new: '2026-05-13T00:00:00.000Z' },
      tags: {
        old: ['a', null],
        new: { keep: true },
      },
    });
  });
});
