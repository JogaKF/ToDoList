import type { SQLiteDatabase } from 'expo-sqlite';

import type { TodoList } from '../../features/lists/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';

type CreateListInput = {
  name: string;
  type: TodoList['type'];
};

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

    return list;
  },

  async rename(db: SQLiteDatabase, id: string, name: string) {
    await db.runAsync(
      `UPDATE lists
       SET name = ?, updatedAt = ?
       WHERE id = ?`,
      name.trim(),
      nowIso(),
      id
    );
  },

  async softDelete(db: SQLiteDatabase, id: string) {
    const deletedAt = nowIso();

    await db.withExclusiveTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE lists
         SET deletedAt = ?, updatedAt = ?
         WHERE id = ?`,
        deletedAt,
        deletedAt,
        id
      );

      await db.runAsync(
        `UPDATE items
         SET deletedAt = ?, updatedAt = ?
         WHERE listId = ? AND deletedAt IS NULL`,
        deletedAt,
        deletedAt,
        id
      );
    });
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
