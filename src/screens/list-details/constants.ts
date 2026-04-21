import type { RecurrenceType } from '../../features/items/types';
export { defaultShoppingCategories, shoppingQuickUnits } from '../../features/items/shoppingConstants';

export const recurrenceOptions: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'custom'];

export const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Jednorazowe',
  daily: 'Codziennie',
  weekly: 'Co tydzien',
  monthly: 'Co miesiac',
  weekdays: 'Dni robocze',
  custom: 'Niestandardowo',
};
