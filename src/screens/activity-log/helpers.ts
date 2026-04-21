import { formatDateLabel } from '../../utils/date';

export function formatAuditDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAuditDay(value: string) {
  return value.slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/) ? formatDateLabel(value.slice(0, 10)) : value;
}

export function getAuditContext(itemTitle: string | null, listName: string | null) {
  if (itemTitle && listName) {
    return `${itemTitle} • ${listName}`;
  }

  return itemTitle ?? listName ?? 'Brak kontekstu';
}
