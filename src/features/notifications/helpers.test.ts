import { describe, expect, it } from 'vitest';

import {
  buildLocalReminderDate,
  buildNotificationIdentifier,
  isFutureReminderDate,
  isManagedNotification,
  parseNotificationTime,
} from './helpers';

describe('notification helpers', () => {
  it('parses notification time safely', () => {
    expect(parseNotificationTime('08:30')).toEqual({ hour: 8, minute: 30, value: '08:30' });
    expect(parseNotificationTime('99:99', '07:15')).toEqual({ hour: 7, minute: 15, value: '07:15' });
    expect(parseNotificationTime('bad', '18:00')).toEqual({ hour: 18, minute: 0, value: '18:00' });
  });

  it('builds local reminder dates from date keys and time preferences', () => {
    const reminderDate = buildLocalReminderDate('2026-04-19', '09:45');

    expect(reminderDate.getFullYear()).toBe(2026);
    expect(reminderDate.getMonth()).toBe(3);
    expect(reminderDate.getDate()).toBe(19);
    expect(reminderDate.getHours()).toBe(9);
    expect(reminderDate.getMinutes()).toBe(45);
  });

  it('checks whether reminder dates are still schedulable', () => {
    const now = new Date(2026, 3, 19, 10, 0, 0);

    expect(isFutureReminderDate(new Date(2026, 3, 19, 10, 1, 0), now)).toBe(true);
    expect(isFutureReminderDate(new Date(2026, 3, 19, 9, 59, 0), now)).toBe(false);
  });

  it('marks only app-managed notification identifiers', () => {
    const identifier = buildNotificationIdentifier('due', 'item-1');

    expect(identifier).toBe('todo-local-reminder:due:item-1');
    expect(isManagedNotification(identifier)).toBe(true);
    expect(isManagedNotification('external:notification')).toBe(false);
  });
});
