import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '../../features/items/types';
import type { DeletedTodoList, TodoList, TodoListSummary } from '../../features/lists/types';
import type { SyncOperation } from '../../features/sync/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';
import { syncRepository } from './syncRepository';

type CreateListInput = {
  name: string;
  type: TodoList['type'];
};

async function getListSnapshot(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<TodoList>(
    `SELECT * FROM lists WHERE id = ?`,
    id
  );
}

async function enqueueListSnapshot(db: SQLiteDatabase, id: string, operation: SyncOperation, fallback?: unknown) {
  const snapshot = await getListSnapshot(db, id);
  await syncRepository.enqueueChange(db, {
    entityType: 'list',
    entityId: id,
    operation,
    payload: snapshot ?? fallback ?? { id },
  });
}

export const listsRepository = {
  async getAll(db: SQLiteDatabase) {
    return db.getAllAsync<TodoList>(
      `SELECT * FROM lists
       WHERE deletedAt IS NULL
       ORDER BY position ASC, createdAt ASC`
    );
  },

  async getById(db: SQLiteDatabase, id: string) {
    return db.getFirstAsync<TodoList>(
      `SELECT * FROM lists
       WHERE id = ? AND deletedAt IS NULL`,
      id
    );
  },

  async getDeleted(db: SQLiteDatabase) {
    return db.getAllAsync<DeletedTodoList>(
      `SELECT * FROM lists
       WHERE deletedAt IS NOT NULL
       ORDER BY deletedAt DESC, updatedAt DESC`
    );
  },

  async getSummaries(db: SQLiteDatabase) {
    return db.getAllAsync<TodoListSummary>(
      `SELECT
         lists.id as listId,
         COUNT(items.id) as totalItems,
         COALESCE(SUM(CASE WHEN items.status = 'todo' THEN 1 ELSE 0 END), 0) as openItems,
         COALESCE(SUM(CASE WHEN items.status = 'done' THEN 1 ELSE 0 END), 0) as doneItems,
         COALESCE(SUM(CASE WHEN items.myDayDate IS NOT NULL THEN 1 ELSE 0 END), 0) as myDayItems
       FROM lists
       LEFT JOIN items
         ON items.listId = lists.id
        AND items.deletedAt IS NULL
       WHERE lists.deletedAt IS NULL
       GROUP BY lists.id`
    );
  },

  async create(db: SQLiteDatabase, input: CreateListInput) {
    const timestamp = nowIso();
    const position = await this.getNextPosition(db);
    const list: TodoList = {
      id: createId('list'),
      name: input.name.trim(),
      type: input.type,
      position,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    await db.runAsync(
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

    await syncRepository.enqueueChange(db, {
      entityType: 'list',
      entityId: list.id,
      operation: 'create',
      payload: list,
      changedAt: list.updatedAt,
    });

    return list;
  },

  async rename(db: SQLiteDatabase, id: string, name: string) {
    const timestamp = nowIso();
    await db.runAsync(
      `UPDATE lists
       SET name = ?, updatedAt = ?
       WHERE id = ?`,
      name.trim(),
      timestamp,
      id
    );

    await enqueueListSnapshot(db, id, 'update');
  },

  async softDelete(db: SQLiteDatabase, id: string) {
    const deletedAt = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE lists
         SET deletedAt = ?, updatedAt = ?
         WHERE id = ?`,
        deletedAt,
        deletedAt,
        id
      );

      await txn.runAsync(
        `UPDATE items
         SET deletedAt = ?, updatedAt = ?
         WHERE listId = ? AND deletedAt IS NULL`,
        deletedAt,
        deletedAt,
        id
      );
    });

    await enqueueListSnapshot(db, id, 'delete');
  },

  async restore(db: SQLiteDatabase, id: string) {
    const restoredAt = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE lists
         SET deletedAt = NULL, updatedAt = ?
         WHERE id = ?`,
        restoredAt,
        id
      );

      await txn.runAsync(
        `UPDATE items
         SET deletedAt = NULL, updatedAt = ?
         WHERE listId = ?`,
        restoredAt,
        id
      );
    });

    await enqueueListSnapshot(db, id, 'restore');
  },

  async hardDelete(db: SQLiteDatabase, id: string) {
    const snapshot = await getListSnapshot(db, id);
    const relatedItems = await db.getAllAsync<Item>(
      `SELECT * FROM items WHERE listId = ?`,
      id
    );

    await syncRepository.enqueueChange(db, {
      entityType: 'list',
      entityId: id,
      operation: 'purge',
      payload: snapshot ?? { id },
    });
    for (const item of relatedItems) {
      await syncRepository.enqueueChange(db, {
        entityType: 'item',
        entityId: item.id,
        operation: 'purge',
        payload: item,
      });
    }

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `DELETE FROM items
         WHERE listId = ?`,
        id
      );

      await txn.runAsync(
        `DELETE FROM lists
         WHERE id = ?`,
        id
      );
    });
  },

  async hardDeleteAllDeleted(db: SQLiteDatabase) {
    const deletedLists = await this.getDeleted(db);
    const deletedItems = await db.getAllAsync<Item>(
      `SELECT * FROM items WHERE deletedAt IS NOT NULL`
    );

    for (const list of deletedLists) {
      await syncRepository.enqueueChange(db, {
        entityType: 'list',
        entityId: list.id,
        operation: 'purge',
        payload: list,
      });
    }
    for (const item of deletedItems) {
      await syncRepository.enqueueChange(db, {
        entityType: 'item',
        entityId: item.id,
        operation: 'purge',
        payload: item,
      });
    }

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `DELETE FROM items
         WHERE deletedAt IS NOT NULL`
      );

      await txn.runAsync(
        `DELETE FROM lists
         WHERE deletedAt IS NOT NULL`
      );
    });
  },

  async duplicateShoppingList(db: SQLiteDatabase, id: string, name?: string) {
    const sourceList = await this.getById(db, id);
    if (!sourceList || sourceList.type !== 'shopping') {
      return null;
    }

    const timestamp = nowIso();
    const position = await this.getNextPosition(db);
    const duplicateId = createId('list');
    const duplicateName = name?.trim() || `${sourceList.name} kopia`;

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO lists (id, name, type, position, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        duplicateId,
        duplicateName,
        'shopping',
        position,
        timestamp,
        timestamp,
        null
      );

      const sourceItems = await txn.getAllAsync<{
        id: string;
        title: string;
        category: string | null;
        quantity: string | null;
        unit: string | null;
        status: string;
        position: number;
        createdAt: string;
      }>(
        `SELECT id, title, category, quantity, unit, status, position, createdAt
         FROM items
         WHERE listId = ? AND deletedAt IS NULL
         ORDER BY position ASC, createdAt ASC`,
        id
      );

      for (const sourceItem of sourceItems) {
        await txn.runAsync(
          `INSERT INTO items (
            id, listId, parentId, type, title, category, quantity, unit, note, status, dueDate, recurrenceType, recurrenceConfig, recurrenceOriginId, previousRecurringItemId, recurrenceIsException, myDayDate, position, createdAt, updatedAt, deletedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          createId('item'),
          duplicateId,
          null,
          'shopping',
          sourceItem.title,
          sourceItem.category,
          sourceItem.quantity,
          sourceItem.unit,
          null,
          sourceItem.status,
          null,
          'none',
          null,
          null,
          null,
          0,
          null,
          sourceItem.position,
          timestamp,
          timestamp,
          null
        );
      }
    });

    await enqueueListSnapshot(db, duplicateId, 'create');
    const duplicateItems = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM items WHERE listId = ?`,
      duplicateId
    );
    for (const item of duplicateItems) {
      await syncRepository.enqueueChange(db, {
        entityType: 'item',
        entityId: item.id,
        operation: 'create',
        payload: await db.getFirstAsync(`SELECT * FROM items WHERE id = ?`, item.id),
      });
    }

    return duplicateId;
  },

  async getNextPosition(db: SQLiteDatabase) {
    const row = await db.getFirstAsync<{ maxPosition: number | null }>(
      `SELECT MAX(position) as maxPosition
       FROM lists
       WHERE deletedAt IS NULL`
    );

    return (row?.maxPosition ?? 0) + 1000;
  },
};
