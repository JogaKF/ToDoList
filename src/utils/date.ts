export function nowIso() {
  return new Date().toISOString();
}

export function isValidDateKey(value: string | null | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dateKeyWithOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function addDays(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setUTCDate(next.getUTCDate() + amount);
  return toDateKey(next);
}

export function addMonths(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return toDateKey(next);
}

export function formatDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatMonthLabel(dateKey: string) {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat('pl-PL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function startOfMonth(dateKey: string) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(1);
  return toDateKey(date);
}

export function endOfMonth(dateKey: string) {
  const date = parseDateKey(dateKey);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return toDateKey(date);
}

export function monthGrid(dateKey: string) {
  const firstDay = parseDateKey(startOfMonth(dateKey));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(gridStart.getUTCDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + index);
    return toDateKey(current);
  });
}

export function compareDateKeys(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right);
}
