import { describe, expect, it } from 'vitest';

import { getNextRecurringDate, getUpcomingRecurringDates, parseRecurrenceConfig } from './recurrence';

describe('recurrence utils', () => {
  it('parses recurrence config with safe defaults', () => {
    expect(parseRecurrenceConfig(null)).toEqual({ interval: 1, unit: 'weeks' });
    expect(parseRecurrenceConfig('{"interval":3,"unit":"days"}')).toEqual({ interval: 3, unit: 'days' });
    expect(parseRecurrenceConfig('{"interval":0}')).toEqual({ interval: 1, unit: 'weeks' });
    expect(parseRecurrenceConfig('bad json')).toEqual({ interval: 1, unit: 'weeks' });
  });

  it('moves daily and weekly recurrences beyond the reference date', () => {
    expect(getNextRecurringDate('2026-04-15', 'daily', null, '2026-04-18')).toBe('2026-04-19');
    expect(getNextRecurringDate('2026-04-01', 'weekly', null, '2026-04-18')).toBe('2026-04-22');
  });

  it('handles weekday recurrence by skipping weekends', () => {
    expect(getNextRecurringDate('2026-04-17', 'weekdays', null, '2026-04-17')).toBe('2026-04-20');
    expect(getUpcomingRecurringDates('2026-04-17', 'weekdays', null, 3)).toEqual([
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
    ]);
  });

  it('handles custom recurrences for days and months', () => {
    expect(getNextRecurringDate('2026-04-10', 'custom', '{"interval":2,"unit":"days"}', '2026-04-12')).toBe('2026-04-14');
    expect(getUpcomingRecurringDates('2026-04-10', 'custom', '{"interval":2,"unit":"months"}', 3)).toEqual([
      '2026-06-10',
      '2026-08-10',
      '2026-10-10',
    ]);
  });

  it('returns stable results for non-recurring items', () => {
    expect(getNextRecurringDate('2026-04-18', 'none', null, '2026-04-20')).toBe('2026-04-18');
    expect(getUpcomingRecurringDates('2026-04-18', 'none', null, 3)).toEqual([]);
  });
});
