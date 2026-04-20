import type { SQLiteDatabase } from 'expo-sqlite';

import type { MyDayReminderGroup, ReminderTask } from '../../features/notifications/types';

export const notificationsRepository = {
  getDueReminderTasks(db: SQLiteDatabase, fromDate: string, limit: number) {
    return db.getAllAsync<ReminderTask>(
      `SELECT items.id, items.title, lists.name as listName, items.dueDate as plannedDate
       FROM items
       INNER JOIN lists ON lists.id = items.listId
       WHERE items.deletedAt IS NULL
         AND lists.deletedAt IS NULL
         AND items.type = 'task'
         AND items.status = 'todo'
         AND items.dueDate IS NOT NULL
         AND items.dueDate >= ?
       ORDER BY items.dueDate ASC, items.position ASC, items.createdAt ASC
       LIMIT ?`,
      fromDate,
      limit
    );
  },

  getMyDayReminderGroups(db: SQLiteDatabase, fromDate: string, limit: number) {
    return db.getAllAsync<MyDayReminderGroup>(
      `SELECT items.myDayDate as dateKey, COUNT(items.id) as taskCount, MIN(items.title) as sampleTitle
       FROM items
       INNER JOIN lists ON lists.id = items.listId
       WHERE items.deletedAt IS NULL
         AND lists.deletedAt IS NULL
         AND items.type = 'task'
         AND items.status = 'todo'
         AND items.myDayDate IS NOT NULL
         AND items.myDayDate >= ?
       GROUP BY items.myDayDate
       ORDER BY items.myDayDate ASC
       LIMIT ?`,
      fromDate,
      limit
    );
  },
};
