import type { SQLiteDatabase } from 'expo-sqlite';

import { syncRepository } from './syncRepository';
import { nowIso } from '../../utils/date';

export const settingsRepository = {
  async getAll(db: SQLiteDatabase) {
    const rows = await db.getAllAsync<{ key: string; value: string | null }>(
      `SELECT key, value FROM settings`
    );

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },

  async set(db: SQLiteDatabase, key: string, value: string | null) {
    const timestamp = nowIso();
    await db.runAsync(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );

    await syncRepository.enqueueChange(db, {
      entityType: 'settings',
      entityId: key,
      operation: value === null ? 'delete' : 'update',
      payload: {
        key,
        value,
        updatedAt: timestamp,
      },
      changedAt: timestamp,
    });
  },
};
