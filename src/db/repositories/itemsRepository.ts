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

  async moveWithinSiblings(db: SQLiteDatabase, item: Item, direction: 'up' | 'down') {
    const siblings = await db.getAllAsync<Pick<Item, 'id' | 'position'>>(
      `SELECT id, position
       FROM items
       WHERE listId = ?
         AND deletedAt IS NULL
         AND ((parentId IS NULL AND ? IS NULL) OR parentId = ?)
       ORDER BY position ASC, createdAt ASC`,
      item.listId,
      item.parentId,
      item.parentId
    );

    const currentIndex = siblings.findIndex((sibling) => sibling.id === item.id);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const target = siblings[targetIndex];
    if (!target) {
      return;
    }

    const timestamp = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE items
         SET position = ?, updatedAt = ?
         WHERE id = ?`,
        target.position,
        timestamp,
        item.id
      );

      await txn.runAsync(
        `UPDATE items
         SET position = ?, updatedAt = ?
         WHERE id = ?`,
        item.position,
        timestamp,
        target.id
      );
    });
  },

  async toggleStatus(db: SQLiteDatabase, item: Item) {
    const nextStatus = item.status === 'todo' ? 'done' : 'todo';
    const timestamp = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const descendantIds = await this.getDescendantIds(txn, item.id);
      const targetIds = [item.id, ...descendantIds];

      for (const targetId of targetIds) {
        await txn.runAsync(
          `UPDATE items
           SET status = ?, updatedAt = ?
           WHERE id = ? AND deletedAt IS NULL`,
          nextStatus,
          timestamp,
          targetId
        );
      }

      if (nextStatus === 'todo') {
        const ancestorIds = await this.getAncestorIds(txn, item.parentId);

        for (const ancestorId of ancestorIds) {
          await txn.runAsync(
            `UPDATE items
             SET status = ?, updatedAt = ?
             WHERE id = ? AND deletedAt IS NULL`,
            'todo',
            timestamp,
            ancestorId
          );
        }
      }
    });
  },

  async setMyDay(db: SQLiteDatabase, id: string, dateKey: string | null) {
    const timestamp = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const descendantIds = await this.getDescendantIds(txn, id);
      const targetIds = [id, ...descendantIds];

      for (const targetId of targetIds) {
        await txn.runAsync(
          `UPDATE items
           SET myDayDate = ?, updatedAt = ?
           WHERE id = ? AND deletedAt IS NULL`,
          dateKey,
          timestamp,
          targetId
        );
      }
    });
  },

  async softDelete(db: SQLiteDatabase, id: string) {
    const deletedAt = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const idsToDelete = await this.getDescendantIds(txn, id);
      const targets = [id, ...idsToDelete];

      for (const targetId of targets) {
        await txn.runAsync(
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

  async getAncestorIds(db: SQLiteDatabase, parentId: string | null) {
    if (!parentId) {
      return [];
    }

    const allItems = await db.getAllAsync<Pick<Item, 'id' | 'parentId'>>(
      `SELECT id, parentId FROM items WHERE deletedAt IS NULL`
    );

    const parentById = new Map<string, string | null>();
    for (const item of allItems) {
      parentById.set(item.id, item.parentId);
    }

    const result: string[] = [];
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      result.push(currentParentId);
      currentParentId = parentById.get(currentParentId) ?? null;
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
