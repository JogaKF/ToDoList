export const NOTIFICATION_CHANNEL_ID = 'todo-local-reminders';
export const MANAGED_NOTIFICATION_PREFIX = 'todo-local-reminder:';
export const MAX_SCHEDULED_REMINDERS = 60;

export function parseNotificationTime(value: string, fallback = '09:00') {
  const candidate = /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const [hour, minute] = candidate.split(':').map(Number);

  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return {
      hour,
      minute,
      value: candidate,
    };
  }

  return parseNotificationTime(fallback, '09:00');
}

export function buildLocalReminderDate(dateKey: string, timeValue: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const { hour, minute } = parseNotificationTime(timeValue);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function isFutureReminderDate(date: Date, now = new Date()) {
  return date.getTime() > now.getTime();
}

export function buildNotificationIdentifier(kind: 'due' | 'myday' | 'daily', id: string) {
  return `${MANAGED_NOTIFICATION_PREFIX}${kind}:${id}`;
}

export function isManagedNotification(identifier: string) {
  return identifier.startsWith(MANAGED_NOTIFICATION_PREFIX);
}
