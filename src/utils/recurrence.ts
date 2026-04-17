import type { RecurrenceType, RecurrenceUnit } from '../features/items/types';
import { addDays, addMonths, isValidDateKey, parseDateKey, toDateKey, todayKey } from './date';

type ParsedRecurrenceConfig = {
  interval: number;
  unit: RecurrenceUnit;
};

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

export function getUpcomingRecurringDates(
  dueDate: string | null,
  recurrenceType: RecurrenceType,
  recurrenceConfig: string | null,
  count = 4
) {
  if (recurrenceType === 'none') {
    return [];
  }

  const result: string[] = [];
  let current = isValidDateKey(dueDate) ? dueDate! : todayKey();

  for (let index = 0; index < count; index += 1) {
    current = stepRecurrence(current, recurrenceType, recurrenceConfig);
    result.push(current);
  }

  return result;
}
