import { PropsWithChildren, useEffect } from 'react';

import { useAppDatabase } from '../../db/sqlite';
import { notificationsService } from '../../features/notifications/service';
import { usePreferences } from './PreferencesProvider';
import { useRecovery } from './RecoveryProvider';

export function NotificationsProvider({ children }: PropsWithChildren) {
  const db = useAppDatabase();
  const { mutationTick } = useRecovery();
  const {
    isReady,
    language,
    dueReminderEnabled,
    dueReminderTime,
    myDayReminderEnabled,
    myDayReminderTime,
    dailyReviewEnabled,
    dailyReviewTime,
  } = usePreferences();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void notificationsService.syncLocalNotifications(db, {
      language,
      dueReminderEnabled,
      dueReminderTime,
      myDayReminderEnabled,
      myDayReminderTime,
      dailyReviewEnabled,
      dailyReviewTime,
    });
  }, [
    dailyReviewEnabled,
    dailyReviewTime,
    db,
    dueReminderEnabled,
    dueReminderTime,
    isReady,
    language,
    mutationTick,
    myDayReminderEnabled,
    myDayReminderTime,
  ]);

  return children;
}
