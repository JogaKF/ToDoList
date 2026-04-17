import type { SQLiteDatabase } from 'expo-sqlite';

import type { DeletedItem, Item, RecurrenceType } from '../../features/items/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';
import { getNextRecurringDate } from '../../utils/recurrence';

type CreateItemInput = {
  listId: string;
  title: string;
  parentId?: string | null;
  type?: Item['type'];
  category?: string | null;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
  dueDate?: string | null;
  recurrenceType?: RecurrenceType;
  recurrenceConfig?: string | null;
};

export const itemsRepository = {
  async getById(db: SQLiteDatabase, id: string) {
    return db.getFirstAsync<Item>(
      `SELECT * FROM items
       WHERE id = ? AND deletedAt IS NULL`,
      id
    );
  },

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

  async getDeleted(db: SQLiteDatabase) {
    return db.getAllAsync<DeletedItem>(
      `SELECT items.*, lists.name as listName
       FROM items
       INNER JOIN lists ON lists.id = items.listId
       WHERE items.deletedAt IS NOT NULL
         AND lists.deletedAt IS NULL
       ORDER BY items.deletedAt DESC, items.updatedAt DESC`
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
      category: input.category?.trim() ? input.category.trim() : null,
      quantity: input.quantity?.trim() ? input.quantity.trim() : null,
      unit: input.unit?.trim() ? input.unit.trim() : null,
      note: input.note?.trim() ? input.note.trim() : null,
      status: 'todo',
      dueDate: input.dueDate ?? null,
      recurrenceType: input.recurrenceType ?? 'none',
      recurrenceConfig: input.recurrenceConfig ?? null,
      recurrenceOriginId: input.recurrenceType && input.recurrenceType !== 'none' ? createId('recurrence') : null,
      previousRecurringItemId: null,
      myDayDate: null,
      position,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    await db.runAsync(
      `INSERT INTO items (
        id, listId, parentId, type, title, category, quantity, unit, note, status, dueDate, recurrenceType, recurrenceConfig, recurrenceOriginId, previousRecurringItemId, myDayDate, position, createdAt, updatedAt, deletedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async updateDetails(
    db: SQLiteDatabase,
    id: string,
    input: {
      title: string;
      category: string | null;
      quantity: string | null;
      unit: string | null;
      note: string | null;
      dueDate: string | null;
      recurrenceType: RecurrenceType;
      recurrenceConfig: string | null;
    }
  ) {
    await db.runAsync(
      `UPDATE items
       SET title = ?, category = ?, quantity = ?, unit = ?, note = ?, dueDate = ?, recurrenceType = ?, recurrenceConfig = ?, recurrenceOriginId = CASE
         WHEN ? != 'none' AND recurrenceOriginId IS NULL THEN id
         WHEN ? = 'none' THEN NULL
         ELSE recurrenceOriginId
       END, updatedAt = ?
       WHERE id = ?`,
      input.title.trim(),
      input.category?.trim() ? input.category.trim() : null,
      input.quantity?.trim() ? input.quantity.trim() : null,
      input.unit?.trim() ? input.unit.trim() : null,
      input.note?.trim() ? input.note.trim() : null,
      input.dueDate,
      input.recurrenceType,
      input.recurrenceConfig,
      input.recurrenceType,
      input.recurrenceType,
      nowIso(),
      id
    );
  },

  async moveToParent(db: SQLiteDatabase, item: Item, nextParentId: string | null) {
    const nextPosition = await this.getNextPosition(db, item.listId, nextParentId);

    await db.runAsync(
      `UPDATE items
       SET parentId = ?, position = ?, updatedAt = ?
       WHERE id = ?`,
      nextParentId,
      nextPosition,
      nowIso(),
      item.id
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
      if (item.recurrenceType !== 'none') {
        if (nextStatus === 'done') {
          await this.completeRecurringItem(txn, item, timestamp);
          return;
        }

        await this.undoRecurringCompletion(txn, item, timestamp);
        return;
      }

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

  async completeRecurringItem(db: SQLiteDatabase, item: Item, timestamp: string) {
    const subtree = await this.getSubtreeItems(db, item.id);
    const nextDueDate = getNextRecurringDate(item.dueDate, item.recurrenceType, item.recurrenceConfig);

    for (const subtreeItem of subtree) {
      await db.runAsync(
        `UPDATE items
         SET status = ?, myDayDate = ?, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL`,
        'done',
        null,
        timestamp,
        subtreeItem.id
      );
    }

    const idMap = new Map<string, string>();
    const rootPosition = await this.getNextPosition(db, item.listId, item.parentId);

    for (const subtreeItem of subtree) {
      const newId = createId('item');
      idMap.set(subtreeItem.id, newId);

      const isRoot = subtreeItem.id === item.id;
      const clonedParentId = isRoot ? subtreeItem.parentId : idMap.get(subtreeItem.parentId ?? '') ?? null;

      await db.runAsync(
        `INSERT INTO items (
          id, listId, parentId, type, title, category, quantity, unit, note, status, dueDate, recurrenceType, recurrenceConfig, recurrenceOriginId, previousRecurringItemId, myDayDate, position, createdAt, updatedAt, deletedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId,
        subtreeItem.listId,
        clonedParentId,
        subtreeItem.type,
        subtreeItem.title,
        subtreeItem.category,
        subtreeItem.quantity,
        subtreeItem.unit,
        subtreeItem.note,
        'todo',
        isRoot ? nextDueDate : subtreeItem.dueDate,
        subtreeItem.recurrenceType,
        subtreeItem.recurrenceConfig,
        subtreeItem.recurrenceOriginId ?? item.recurrenceOriginId ?? item.id,
        subtreeItem.id,
        null,
        isRoot ? rootPosition : subtreeItem.position,
        timestamp,
        timestamp,
        null
      );
    }
  },

  async undoRecurringCompletion(db: SQLiteDatabase, item: Item, timestamp: string) {
    const subtree = await this.getSubtreeItems(db, item.id, true);
    const subtreeIds = new Set(subtree.map((subtreeItem) => subtreeItem.id));

    const allActiveItems = await db.getAllAsync<Item>(
      `SELECT * FROM items WHERE deletedAt IS NULL`
    );

    const generatedItems = allActiveItems.filter((candidate) =>
      candidate.previousRecurringItemId ? subtreeIds.has(candidate.previousRecurringItemId) : false
    );

    for (const generatedItem of generatedItems) {
      await db.runAsync(
        `UPDATE items
         SET deletedAt = ?, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL`,
        timestamp,
        timestamp,
        generatedItem.id
      );
    }

    for (const subtreeItem of subtree) {
      await db.runAsync(
        `UPDATE items
         SET status = ?, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL`,
        'todo',
        timestamp,
        subtreeItem.id
      );
    }

    const ancestorIds = await this.getAncestorIds(db, item.parentId);
    for (const ancestorId of ancestorIds) {
      await db.runAsync(
        `UPDATE items
         SET status = ?, updatedAt = ?
         WHERE id = ? AND deletedAt IS NULL`,
        'todo',
        timestamp,
        ancestorId
      );
    }
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

  async softDeleteMany(db: SQLiteDatabase, ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    const deletedAt = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const id of ids) {
        await txn.runAsync(
          `UPDATE items
           SET deletedAt = ?, updatedAt = ?
           WHERE id = ? AND deletedAt IS NULL`,
          deletedAt,
          deletedAt,
          id
        );
      }
    });
  },

  async indentUnderPreviousSibling(db: SQLiteDatabase, item: Item) {
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
    const previousSibling = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    if (!previousSibling) {
      return;
    }

    await this.moveToParent(db, item, previousSibling.id);
  },

  async outdentOneLevel(db: SQLiteDatabase, item: Item) {
    if (!item.parentId) {
      return;
    }

    const parent = await db.getFirstAsync<Pick<Item, 'id' | 'parentId'>>(
      `SELECT id, parentId
       FROM items
       WHERE id = ? AND deletedAt IS NULL`,
      item.parentId
    );

    if (!parent) {
      return;
    }

    await this.moveToParent(db, item, parent.parentId ?? null);
  },

  async restore(db: SQLiteDatabase, id: string) {
    const restoredAt = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const idsToRestore = await this.getDescendantIds(txn, id, true);
      const targets = [id, ...idsToRestore];

      for (const targetId of targets) {
        await txn.runAsync(
          `UPDATE items
           SET deletedAt = NULL, updatedAt = ?
           WHERE id = ?`,
          restoredAt,
          targetId
        );
      }
    });
  },

  async getDescendantIds(db: SQLiteDatabase, rootId: string, includeDeleted = false) {
    const allItems = await db.getAllAsync<Pick<Item, 'id' | 'parentId'>>(
      `SELECT id, parentId FROM items ${includeDeleted ? '' : 'WHERE deletedAt IS NULL'}`
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

  async getSubtreeItems(db: SQLiteDatabase, rootId: string, includeDeleted = false) {
    const allItems = await db.getAllAsync<Item>(
      `SELECT * FROM items ${includeDeleted ? '' : 'WHERE deletedAt IS NULL'}`
    );

    const itemsById = new Map(allItems.map((item) => [item.id, item]));
    const childrenByParent = new Map<string, Item[]>();

    for (const item of allItems) {
      if (!item.parentId) {
        continue;
      }

      const bucket = childrenByParent.get(item.parentId) ?? [];
      bucket.push(item);
      bucket.sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt));
      childrenByParent.set(item.parentId, bucket);
    }

    const root = itemsById.get(rootId);
    if (!root) {
      return [];
    }

    const result: Item[] = [];
    const visit = (current: Item) => {
      result.push(current);
      for (const child of childrenByParent.get(current.id) ?? []) {
        visit(child);
      }
    };

    visit(root);
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
