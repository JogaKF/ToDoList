import type { Item, RecurrenceUnit } from '../../features/items/types';

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseRecurrenceConfig(raw: string | null) {
  if (!raw) {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }

  try {
    const parsed = JSON.parse(raw) as { interval?: number; unit?: RecurrenceUnit };
    return {
      interval: String(parsed.interval ?? 1),
      unit: parsed.unit ?? 'weeks',
    };
  } catch {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }
}

export function buildEditorState(item?: Item | null) {
  const parsed = parseRecurrenceConfig(item?.recurrenceConfig ?? null);

  return {
    title: item?.title ?? '',
    category: item?.category ?? '',
    quantity: item?.quantity ?? '',
    unit: item?.unit ?? '',
    note: item?.note ?? '',
    dueDate: item?.dueDate ?? '',
    recurrenceType: item?.recurrenceType ?? 'none',
    recurrenceInterval: parsed.interval,
    recurrenceUnit: parsed.unit,
  };
}

export type TaskEditorState = ReturnType<typeof buildEditorState>;

export function getRecurrenceSummary(item: Item) {
  switch (item.recurrenceType) {
    case 'daily':
      return 'Codziennie';
    case 'weekly':
      return 'Co tydzien';
    case 'monthly':
      return 'Co miesiac';
    case 'weekdays':
      return 'Dni robocze';
    case 'custom': {
      const parsed = parseRecurrenceConfig(item.recurrenceConfig);
      const unitLabel =
        parsed.unit === 'days' ? 'dni' : parsed.unit === 'months' ? 'miesiace' : 'tygodnie';
      return `Co ${parsed.interval} ${unitLabel}`;
    }
    default:
      return 'Jednorazowe';
  }
}

export function formatShoppingAmount(item: Pick<Item, 'quantity' | 'unit'>) {
  if (!item.quantity && !item.unit) {
    return 'Bez ilosci i jednostki';
  }

  return `${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`.trim();
}

export function formatShoppingSummary(item: Pick<Item, 'category' | 'quantity' | 'unit'>) {
  const parts = [];

  if (item.category?.trim()) {
    parts.push(item.category.trim());
  }

  const amount = item.quantity || item.unit ? formatShoppingAmount(item) : null;
  if (amount) {
    parts.push(amount);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Bez ilosci, jednostki i kategorii';
}
