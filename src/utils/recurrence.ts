import type { RecurrenceType, RecurrenceUnit } from '../features/items/types';
import { todayKey } from './date';

type ParsedRecurrenceConfig = {
  interval: number;
  unit: RecurrenceUnit;
};

function isValidDateKey(value: string | null | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setUTCDate(next.getUTCDate() + amount);
  return toDateKey(next);
}

function addMonths(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return toDateKey(next);
}

function nextWeekday(dateKey: string) {
  let current = addDays(dateKey, 1);

  while (true) {
    const weekday = parseDateKey(current).getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      return current;
    }

    current = addDays(current, 1);
  }
}

export function parseRecurrenceConfig(raw: string | null): ParsedRecurrenceConfig {
  if (!raw) {
    return { interval: 1, unit: 'weeks' };
  }

  try {
    const parsed = JSON.parse(raw) as { interval?: number; unit?: RecurrenceUnit };
    return {
      interval: Math.max(1, parsed.interval ?? 1),
      unit: parsed.unit ?? 'weeks',
    };
  } catch {
    return { interval: 1, unit: 'weeks' };
  }
}

function stepRecurrence(dateKey: string, recurrenceType: RecurrenceType, recurrenceConfig: string | null) {
  switch (recurrenceType) {
    case 'daily':
      return addDays(dateKey, 1);
    case 'weekly':
      return addDays(dateKey, 7);
    case 'monthly':
      return addMonths(dateKey, 1);
    case 'weekdays':
      return nextWeekday(dateKey);
    case 'custom': {
      const parsed = parseRecurrenceConfig(recurrenceConfig);
      if (parsed.unit === 'days') {
        return addDays(dateKey, parsed.interval);
      }

      if (parsed.unit === 'months') {
        return addMonths(dateKey, parsed.interval);
      }

      return addDays(dateKey, parsed.interval * 7);
    }
    default:
      return dateKey;
  }
}

export function getNextRecurringDate(
  dueDate: string | null,
  recurrenceType: RecurrenceType,
  recurrenceConfig: string | null,
  referenceDate = todayKey()
) {
  if (recurrenceType === 'none') {
    return dueDate;
  }

  let current = isValidDateKey(dueDate) ? dueDate! : referenceDate;

  do {
    current = stepRecurrence(current, recurrenceType, recurrenceConfig);
  } while (current <= referenceDate);

  return current;
}
