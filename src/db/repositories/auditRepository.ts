import type { SQLiteDatabase } from 'expo-sqlite';

import type { AuditLogEntry } from '../../features/audit/types';

export const auditRepository = {
  getEntries(db: SQLiteDatabase) {
    return db.getAllAsync<AuditLogEntry>(
      `SELECT
         item_activity.id,
         item_activity.itemId,
         item_activity.action,
         item_activity.label,
         item_activity.createdAt,
         items.title as itemTitle,
         items.type as itemType,
         items.status as itemStatus,
         items.deletedAt as itemDeletedAt,
         lists.id as listId,
         lists.name as listName,
         lists.type as listType,
         lists.deletedAt as listDeletedAt
       FROM item_activity
       LEFT JOIN items ON items.id = item_activity.itemId
       LEFT JOIN lists ON lists.id = items.listId
       ORDER BY item_activity.createdAt DESC`
    );
  },
};
