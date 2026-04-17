import type { SQLiteDatabase } from 'expo-sqlite';

export const settingsRepository = {
  async getAll(db: SQLiteDatabase) {
    const rows = await db.getAllAsync<{ key: string; value: string | null }>(
      `SELECT key, value FROM settings`
    );

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },

  async set(db: SQLiteDatabase, key: string, value: string | null) {
    await db.runAsync(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  },
};
