import type { RecurrenceType } from '../../features/items/types';

export const recurrenceOptions: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'custom'];

export const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Jednorazowe',
  daily: 'Codziennie',
  weekly: 'Co tydzien',
  monthly: 'Co miesiac',
  weekdays: 'Dni robocze',
  custom: 'Niestandardowo',
};

export const shoppingQuickUnits = ['szt', 'kg', 'g', 'l', 'ml', 'opak'] as const;

export const defaultShoppingCategories = ['Warzywa', 'Owoce', 'Nabial', 'Pieczywo', 'Mieso', 'Napoje', 'Chemia'] as const;
