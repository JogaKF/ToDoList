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
      quantity TEXT,
      unit TEXT,
      note TEXT,
      status TEXT NOT NULL,
      dueDate TEXT,
      recurrenceType TEXT NOT NULL DEFAULT 'none',
      recurrenceConfig TEXT,
      recurrenceOriginId TEXT,
      previousRecurringItemId TEXT,
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

  await ensureItemsColumns(db);
  await ensureItemsIndexes(db);
}

async function ensureItemsColumns(db: SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(items)`);
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('note')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN note TEXT;`);
  }

  if (!columnNames.has('quantity')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN quantity TEXT;`);
  }

  if (!columnNames.has('unit')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN unit TEXT;`);
  }

  if (!columnNames.has('dueDate')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN dueDate TEXT;`);
  }

  if (!columnNames.has('recurrenceType')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN recurrenceType TEXT NOT NULL DEFAULT 'none';`);
  }

  if (!columnNames.has('recurrenceConfig')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN recurrenceConfig TEXT;`);
  }

  if (!columnNames.has('recurrenceOriginId')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN recurrenceOriginId TEXT;`);
  }

  if (!columnNames.has('previousRecurringItemId')) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN previousRecurringItemId TEXT;`);
  }
}

async function ensureItemsIndexes(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_items_dueDate ON items(dueDate);
  `);
}
