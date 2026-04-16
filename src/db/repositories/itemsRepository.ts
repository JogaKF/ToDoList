import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '../../features/items/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';

type CreateItemInput = {
  listId: string;
  title: string;
  parentId?: string | null;
  type?: Item['type'];
};

export const itemsRepository = {
  async getByListId(db: SQLiteDatabase, listId: string) {
    return db.getAllAsync<Item>(
      `SELECT * FROM items
       WHERE listId = ? AND deletedAt IS NULL
       ORDER BY parentId ASC, position ASC, createdAt ASC`,
      listId
    );
  },

  async getMyDay(db: SQLiteDatabase, dateKey: string) {
    return db.getAllAsync<Item>(
      `SELECT * FROM items
       WHERE myDayDate = ? AND deletedAt IS NULL
       ORDER BY position ASC, createdAt ASC`,
      dateKey
    );
  },

  async create(db: SQLiteDatabase, input: CreateItemInput) {
    const timestamp = nowIso();
    const position = await this.getNextPosition(db, input.listId, input.parentId ?? null);
    const item: Item = {
      id: createId('item'),
      listId: input.listId,
      parentId: input.parentId ?? null,
      type: input.type ?? 'task',
      title: input.title.trim(),
      status: 'todo',
      myDayDate: null,
      position,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    await db.runAsync(
      `INSERT INTO items (
        id, listId, parentId, type, title, status, myDayDate, position, createdAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.listId,
      item.parentId,
      item.type,
      item.title,
      item.status,
      item.myDayDate,
      item.position,
      item.createdAt,
      item.updatedAt,
      item.deletedAt
    );

    return item;
  },

  async updateTitle(db: SQLiteDatabase, id: string, title: string) {
    await db.runAsync(
      `UPDATE items
       SET title = ?, updatedAt = ?
       WHERE id = ?`,
      title.trim(),
      nowIso(),
      id
    );
  },

  async toggleStatus(db: SQLiteDatabase, item: Item) {
    const nextStatus = item.status === 'todo' ? 'done' : 'todo';

    await db.runAsync(
      `UPDATE items
       SET status = ?, updatedAt = ?
       WHERE id = ?`,
      nextStatus,
      nowIso(),
      item.id
    );
  },

  async setMyDay(db: SQLiteDatabase, id: string, dateKey: string | null) {
    await db.runAsync(
      `UPDATE items
       SET myDayDate = ?, updatedAt = ?
       WHERE id = ?`,
      dateKey,
      nowIso(),
      id
    );
  },

  async softDelete(db: SQLiteDatabase, id: string) {
    const deletedAt = nowIso();

    await db.withExclusiveTransactionAsync(async () => {
      const idsToDelete = await this.getDescendantIds(db, id);
      const targets = [id, ...idsToDelete];

      for (const targetId of targets) {
        await db.runAsync(
          `UPDATE items
           SET deletedAt = ?, updatedAt = ?
           WHERE id = ? AND deletedAt IS NULL`,
          deletedAt,
          deletedAt,
          targetId
        );
      }
    });
  },

  async getDescendantIds(db: SQLiteDatabase, rootId: string) {
    const allItems = await db.getAllAsync<Pick<Item, 'id' | 'parentId'>>(
      `SELECT id, parentId FROM items WHERE deletedAt IS NULL`
    );

    const childrenByParent = new Map<string, string[]>();
    for (const item of allItems) {
      if (!item.parentId) {
        continue;
      }

      const current = childrenByParent.get(item.parentId) ?? [];
      current.push(item.id);
      childrenByParent.set(item.parentId, current);
    }

    const result: string[] = [];
    const queue = [...(childrenByParent.get(rootId) ?? [])];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }

      result.push(currentId);
      queue.push(...(childrenByParent.get(currentId) ?? []));
    }

    return result;
  },

  async getNextPosition(db: SQLiteDatabase, listId: string, parentId: string | null) {
    const row = await db.getFirstAsync<{ maxPosition: number | null }>(
      `SELECT MAX(position) as maxPosition
       FROM items
       WHERE listId = ?
         AND deletedAt IS NULL
         AND ((parentId IS NULL AND ? IS NULL) OR parentId = ?)`,
      listId,
      parentId,
      parentId
    );

    return (row?.maxPosition ?? 0) + 1000;
  },
};
