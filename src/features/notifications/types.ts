export type ReminderTask = {
  id: string;
  title: string;
  listName: string;
  plannedDate: string;
};

export type MyDayReminderGroup = {
  dateKey: string;
  taskCount: number;
  sampleTitle: string | null;
};

export type NotificationPreferences = {
  language: 'pl' | 'en';
  dueReminderEnabled: boolean;
  dueReminderTime: string;
  myDayReminderEnabled: boolean;
  myDayReminderTime: string;
  dailyReviewEnabled: boolean;
  dailyReviewTime: string;
};

export type NotificationSyncSummary = {
  dueReminders: number;
  myDayReminders: number;
  dailyReviewScheduled: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
};
