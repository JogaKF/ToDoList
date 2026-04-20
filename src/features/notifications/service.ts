import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { SQLiteDatabase } from 'expo-sqlite';

import { notificationsRepository } from '../../db/repositories/notificationsRepository';
import { todayKey } from '../../utils/date';
import {
  buildLocalReminderDate,
  buildNotificationIdentifier,
  isFutureReminderDate,
  isManagedNotification,
  MAX_SCHEDULED_REMINDERS,
  NOTIFICATION_CHANNEL_ID,
  parseNotificationTime,
} from './helpers';
import type { MyDayReminderGroup, NotificationPreferences, NotificationSyncSummary, ReminderTask } from './types';

type NotificationsModule = typeof import('expo-notifications');

let isNotificationHandlerConfigured = false;

function getEmptySummary(permissionStatus: NotificationSyncSummary['permissionStatus'] = 'undetermined'): NotificationSyncSummary {
  return {
    dueReminders: 0,
    myDayReminders: 0,
    dailyReviewScheduled: false,
    permissionStatus,
  };
}

function configureNotificationHandler(Notifications: NotificationsModule) {
  if (isNotificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  isNotificationHandlerConfigured = true;
}

function getCopy(language: 'pl' | 'en') {
  if (language === 'en') {
    return {
      dueTitle: (task: ReminderTask) => `Due today: ${task.title}`,
      dueBody: (task: ReminderTask) => `List: ${task.listName}`,
      myDayTitle: (group: MyDayReminderGroup) => `My Day: ${group.dateKey}`,
      myDayBody: (group: MyDayReminderGroup) =>
        group.taskCount === 1
          ? `1 task planned${group.sampleTitle ? `: ${group.sampleTitle}` : ''}`
          : `${group.taskCount} tasks planned${group.sampleTitle ? `, including: ${group.sampleTitle}` : ''}`,
      dailyTitle: 'Daily review',
      dailyBody: 'Check your plan, overdue tasks and My Day.',
    };
  }

  return {
    dueTitle: (task: ReminderTask) => `Termin dzis: ${task.title}`,
    dueBody: (task: ReminderTask) => `Lista: ${task.listName}`,
    myDayTitle: (group: MyDayReminderGroup) => `Moj dzien: ${group.dateKey}`,
    myDayBody: (group: MyDayReminderGroup) =>
      group.taskCount === 1
        ? `1 zadanie w planie${group.sampleTitle ? `: ${group.sampleTitle}` : ''}`
        : `${group.taskCount} zadania w planie${group.sampleTitle ? `, np. ${group.sampleTitle}` : ''}`,
    dailyTitle: 'Codzienny przeglad',
    dailyBody: 'Sprawdz plan, zalegle zadania i Moj dzien.',
  };
}

async function ensureNotificationChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Todo reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1499C8',
  });
}

async function ensurePermissions(Notifications: NotificationsModule): Promise<NotificationSyncSummary['permissionStatus']> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return 'granted';
  }

  if (!current.canAskAgain) {
    return current.status === 'undetermined' ? 'undetermined' : 'denied';
  }

  const requested = await Notifications.requestPermissionsAsync();
  if (requested.granted) {
    return 'granted';
  }

  return requested.status === 'undetermined' ? 'undetermined' : 'denied';
}

async function cancelManagedNotifications(Notifications: NotificationsModule) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managed = scheduled.filter((request) => isManagedNotification(request.identifier));

  await Promise.all(managed.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

async function scheduleDueReminders(
  db: SQLiteDatabase,
  preferences: NotificationPreferences,
  now: Date,
  Notifications: NotificationsModule
) {
  if (!preferences.dueReminderEnabled) {
    return 0;
  }

  const copy = getCopy(preferences.language);
  const tasks = await notificationsRepository.getDueReminderTasks(db, todayKey(), MAX_SCHEDULED_REMINDERS);
  let scheduledCount = 0;

  for (const task of tasks) {
    const triggerDate = buildLocalReminderDate(task.plannedDate, preferences.dueReminderTime);
    if (!isFutureReminderDate(triggerDate, now)) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: buildNotificationIdentifier('due', `${task.id}:${task.plannedDate}`),
      content: {
        title: copy.dueTitle(task),
        body: copy.dueBody(task),
        data: {
          type: 'dueDate',
          itemId: task.id,
          dateKey: task.plannedDate,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
    scheduledCount += 1;
  }

  return scheduledCount;
}

async function scheduleMyDayReminders(
  db: SQLiteDatabase,
  preferences: NotificationPreferences,
  now: Date,
  Notifications: NotificationsModule
) {
  if (!preferences.myDayReminderEnabled) {
    return 0;
  }

  const copy = getCopy(preferences.language);
  const groups = await notificationsRepository.getMyDayReminderGroups(db, todayKey(), MAX_SCHEDULED_REMINDERS);
  let scheduledCount = 0;

  for (const group of groups) {
    const triggerDate = buildLocalReminderDate(group.dateKey, preferences.myDayReminderTime);
    if (!isFutureReminderDate(triggerDate, now)) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: buildNotificationIdentifier('myday', group.dateKey),
      content: {
        title: copy.myDayTitle(group),
        body: copy.myDayBody(group),
        data: {
          type: 'myDay',
          dateKey: group.dateKey,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
    scheduledCount += 1;
  }

  return scheduledCount;
}

async function scheduleDailyReview(preferences: NotificationPreferences, Notifications: NotificationsModule) {
  if (!preferences.dailyReviewEnabled) {
    return false;
  }

  const copy = getCopy(preferences.language);
  const { hour, minute } = parseNotificationTime(preferences.dailyReviewTime, '18:00');

  await Notifications.scheduleNotificationAsync({
    identifier: buildNotificationIdentifier('daily', 'review'),
    content: {
      title: copy.dailyTitle,
      body: copy.dailyBody,
      data: {
        type: 'dailyReview',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });

  return true;
}

export const notificationsService = {
  async syncLocalNotifications(db: SQLiteDatabase, preferences: NotificationPreferences): Promise<NotificationSyncSummary> {
    const hasEnabledReminder =
      preferences.dueReminderEnabled ||
      preferences.myDayReminderEnabled ||
      preferences.dailyReviewEnabled;

    if (isRunningInExpoGo()) {
      return getEmptySummary('undetermined');
    }

    try {
      const Notifications = await import('expo-notifications');
      configureNotificationHandler(Notifications);
      await ensureNotificationChannel(Notifications);
      await cancelManagedNotifications(Notifications);

      if (!hasEnabledReminder) {
        return getEmptySummary();
      }

      const permissionStatus = await ensurePermissions(Notifications);
      if (permissionStatus !== 'granted') {
        return getEmptySummary(permissionStatus);
      }

      const now = new Date();
      const dueReminders = await scheduleDueReminders(db, preferences, now, Notifications);
      const myDayReminders = await scheduleMyDayReminders(db, preferences, now, Notifications);
      const dailyReviewScheduled = await scheduleDailyReview(preferences, Notifications);

      return {
        dueReminders,
        myDayReminders,
        dailyReviewScheduled,
        permissionStatus,
      };
    } catch {
      return getEmptySummary('denied');
    }
  },
};
