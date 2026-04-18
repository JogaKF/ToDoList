import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item, ItemActivity, ShoppingCategory, ShoppingFavorite } from '../../features/items/types';
import type { TodoList } from '../../features/lists/types';
import type { AppBackupData, BackupSettingsRow } from '../../features/backup/types';

export const backupRepository = {
  async exportAll(db: SQLiteDatabase): Promise<AppBackupData> {
    const [lists, items, settings, itemActivity, shoppingCategories, shoppingFavorites] = await Promise.all([
      db.getAllAsync<TodoList>(`SELECT * FROM lists ORDER BY position ASC, createdAt ASC`),
      db.getAllAsync<Item>(`SELECT * FROM items ORDER BY listId ASC, position ASC, createdAt ASC`),
      db.getAllAsync<BackupSettingsRow>(`SELECT key, value FROM settings ORDER BY key ASC`),
      db.getAllAsync<ItemActivity>(`SELECT * FROM item_activity ORDER BY createdAt ASC`),
      db.getAllAsync<ShoppingCategory>(`SELECT * FROM shopping_categories ORDER BY name COLLATE NOCASE ASC, createdAt ASC`),
      db.getAllAsync<ShoppingFavorite>(`SELECT * FROM shopping_favorites ORDER BY lastUsedAt DESC, title COLLATE NOCASE ASC`),
    ]);

    return {
      lists,
      items,
      settings,
      itemActivity,
      shoppingCategories,
      shoppingFavorites,
    };
  },

  async replaceAll(db: SQLiteDatabase, data: AppBackupData) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(`
        DELETE FROM item_activity;
        DELETE FROM shopping_favorites;
        DELETE FROM shopping_categories;
        DELETE FROM settings;
        DELETE FROM items;
        DELETE FROM lists;
      `);

      for (const list of data.lists) {
        await txn.runAsync(
          `INSERT INTO lists (id, name, type, position, createdAt, updatedAt, deletedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          list.id,
          list.name,
          list.type,
          list.position,
          list.createdAt,
          list.updatedAt,
          list.deletedAt
        );
      }

      for (const item of data.items) {
        await txn.runAsync(
          `INSERT INTO items (
            id, listId, parentId, type, title, category, quantity, unit, note, status, dueDate,
            recurrenceType, recurrenceConfig, recurrenceOriginId, previousRecurringItemId, recurrenceIsException,
            myDayDate, position, createdAt, updatedAt, deletedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          item.listId,
          item.parentId,
          item.type,
          item.title,
          item.category,
          item.quantity,
          item.unit,
          item.note,
          item.status,
          item.dueDate,
          item.recurrenceType,
          item.recurrenceConfig,
          item.recurrenceOriginId,
          item.previousRecurringItemId,
          item.recurrenceIsException,
          item.myDayDate,
          item.position,
          item.createdAt,
          item.updatedAt,
          item.deletedAt
        );
      }

      for (const row of data.settings) {
        await txn.runAsync(
          `INSERT INTO settings (key, value)
           VALUES (?, ?)`,
          row.key,
          row.value
        );
      }

      for (const entry of data.itemActivity) {
        await txn.runAsync(
          `INSERT INTO item_activity (id, itemId, action, label, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          entry.id,
          entry.itemId,
          entry.action,
          entry.label,
          entry.createdAt
        );
      }

      for (const category of data.shoppingCategories) {
        await txn.runAsync(
          `INSERT INTO shopping_categories (id, name, createdAt)
           VALUES (?, ?, ?)`,
          category.id,
          category.name,
          category.createdAt
        );
      }

      for (const favorite of data.shoppingFavorites) {
        await txn.runAsync(
          `INSERT INTO shopping_favorites (id, title, category, quantity, unit, createdAt, updatedAt, lastUsedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          favorite.id,
          favorite.title,
          favorite.category,
          favorite.quantity,
          favorite.unit,
          favorite.createdAt,
          favorite.updatedAt,
          favorite.lastUsedAt
        );
      }
    });
  },
};
