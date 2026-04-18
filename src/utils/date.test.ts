import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  compareDateKeys,
  endOfMonth,
  isValidDateKey,
  monthGrid,
  parseDateKey,
  startOfMonth,
  toDateKey,
} from './date';

describe('date utils', () => {
  it('validates date keys', () => {
    expect(isValidDateKey('2026-04-18')).toBe(true);
    expect(isValidDateKey('2026-4-18')).toBe(false);
    expect(isValidDateKey(null)).toBe(false);
  });

  it('parses and serializes UTC dates consistently', () => {
    const parsed = parseDateKey('2026-04-18');

    expect(parsed.toISOString()).toBe('2026-04-18T00:00:00.000Z');
    expect(toDateKey(parsed)).toBe('2026-04-18');
  });

  it('adds days and months using UTC-safe logic', () => {
    expect(addDays('2026-04-18', 3)).toBe('2026-04-21');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03');
  });

  it('returns start and end of month', () => {
    expect(startOfMonth('2026-04-18')).toBe('2026-04-01');
    expect(endOfMonth('2026-02-18')).toBe('2026-02-28');
  });

  it('builds a 6-week month grid starting on monday', () => {
    const grid = monthGrid('2026-04-18');

    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-03-30');
    expect(grid[41]).toBe('2026-05-10');
  });

  it('compares null and present date keys predictably', () => {
    expect(compareDateKeys('2026-04-18', '2026-04-19')).toBeLessThan(0);
    expect(compareDateKeys(null, '2026-04-19')).toBeGreaterThan(0);
    expect(compareDateKeys('2026-04-19', null)).toBeLessThan(0);
    expect(compareDateKeys(null, null)).toBe(0);
  });
});
