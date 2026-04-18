import type { PlannedTask } from '../../features/items/types';
import { formatDateLabel } from '../../utils/date';

export type PlannerMode = 'due' | 'myday';

export function sectionTitleFor(mode: PlannerMode, dateKey: string) {
  return mode === 'due' ? `Termin: ${formatDateLabel(dateKey)}` : `Moj dzien: ${formatDateLabel(dateKey)}`;
}

export function formatTaskMeta(item: PlannedTask, mode: PlannerMode) {
  const parts = [item.listName];

  if (mode === 'due' && item.myDayDate) {
    parts.push(`Moj dzien ${formatDateLabel(item.myDayDate)}`);
  }

  if (mode === 'myday' && item.dueDate) {
    parts.push(`Termin ${formatDateLabel(item.dueDate)}`);
  }

  if (item.recurrenceType !== 'none') {
    parts.push('Powtarzalne');
  }

  return parts.join(' • ');
}
