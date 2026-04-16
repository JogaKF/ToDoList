export function nowIso() {
  return new Date().toISOString();
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dateKeyWithOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
