import type { ItemTreeNode, RecurrenceUnit } from '../../features/items/types';

export type ShoppingSortMode = 'manual' | 'alpha';
export type ShoppingGroupMode = 'flat' | 'unit' | 'category';
export type ShoppingTemplate = {
  title: string;
  category: string | null;
  quantity: string | null;
  unit: string | null;
};
export type ShoppingGroup = {
  key: string;
  label: string | null;
  items: ItemTreeNode[];
};

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

export function getRecurrenceSummary(item: ItemTreeNode) {
  switch (item.recurrenceType) {
    case 'daily':
      return 'Powtarza sie codziennie';
    case 'weekly':
      return 'Powtarza sie co tydzien';
    case 'monthly':
      return 'Powtarza sie co miesiac';
    case 'weekdays':
      return 'Powtarza sie w dni robocze';
    case 'custom': {
      const parsed = parseRecurrenceConfig(item.recurrenceConfig);
      const unitLabel =
        parsed.unit === 'days' ? 'dni' : parsed.unit === 'weeks' ? 'tygodnie' : 'miesiace';
      return `Powtarza sie co ${parsed.interval} ${unitLabel}`;
    }
    default:
      return null;
  }
}

export function formatShoppingAmount(item: Pick<ItemTreeNode, 'quantity' | 'unit'>) {
  if (!item.quantity && !item.unit) {
    return null;
  }

  return `${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`.trim();
}

export function formatShoppingSecondaryMeta(item: ItemTreeNode) {
  const parts = [];

  if (item.category?.trim()) {
    parts.push(item.category.trim());
  }

  const amount = formatShoppingAmount(item);
  if (amount) {
    parts.push(amount);
  }

  return parts.length > 0 ? parts.join(' • ') : null;
}

export function sortShoppingItems(items: ItemTreeNode[], mode: ShoppingSortMode) {
  if (mode === 'manual') {
    return items;
  }

  return [...items].sort((left, right) => left.title.localeCompare(right.title, 'pl', { sensitivity: 'base' }));
}

export function groupShoppingItems(items: ItemTreeNode[], mode: ShoppingGroupMode) {
  if (mode === 'flat') {
    return [{ key: 'all', label: null, items }];
  }

  const groups = new Map<string, ShoppingGroup>();

  for (const item of items) {
    const rawValue =
      mode === 'category'
        ? item.category?.trim()
        : item.unit?.trim();
    const normalizedValue = rawValue?.toLowerCase() || (mode === 'category' ? 'bez-kategorii' : 'bez-jednostki');
    const label = rawValue || (mode === 'category' ? 'Bez kategorii' : 'Bez jednostki');
    const current = groups.get(normalizedValue) ?? {
      key: normalizedValue,
      label,
      items: [],
    };
    current.items.push(item);
    groups.set(normalizedValue, current);
  }

  return [...groups.values()].sort((left, right) => {
    const emptyKey = mode === 'category' ? 'bez-kategorii' : 'bez-jednostki';
    if (left.key === emptyKey) {
      return 1;
    }
    if (right.key === emptyKey) {
      return -1;
    }
    return left.label!.localeCompare(right.label!, 'pl', { sensitivity: 'base' });
  });
}

export function buildTemplateKey(template: ShoppingTemplate) {
  return [
    template.title.trim().toLowerCase(),
    template.category?.trim().toLowerCase() ?? '',
    template.quantity?.trim() ?? '',
    template.unit?.trim() ?? '',
  ].join('|');
}
