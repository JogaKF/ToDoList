import type { SQLiteDatabase } from 'expo-sqlite';

export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      position REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      listId TEXT NOT NULL,
      parentId TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      myDayDate TEXT,
      position REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_lists_deletedAt ON lists(deletedAt);
    CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);
    CREATE INDEX IF NOT EXISTS idx_items_listId ON items(listId);
    CREATE INDEX IF NOT EXISTS idx_items_parentId ON items(parentId);
    CREATE INDEX IF NOT EXISTS idx_items_deletedAt ON items(deletedAt);
    CREATE INDEX IF NOT EXISTS idx_items_myDayDate ON items(myDayDate);
    CREATE INDEX IF NOT EXISTS idx_items_position ON items(position);
  `);
}
