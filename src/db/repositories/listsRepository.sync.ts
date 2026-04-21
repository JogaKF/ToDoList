import type { SQLiteDatabase } from 'expo-sqlite';

import type { TodoList } from '../../features/lists/types';
import type { SyncOperation } from '../../features/sync/types';
import { syncRepository } from './syncRepository';

export function getListSnapshot(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<TodoList>(
    `SELECT * FROM lists WHERE id = ?`,
    id
  );
}

export async function enqueueListSnapshot(
  db: SQLiteDatabase,
  id: string,
  operation: SyncOperation,
  fallback?: unknown
) {
  const snapshot = await getListSnapshot(db, id);
  await syncRepository.enqueueChange(db, {
    entityType: 'list',
    entityId: id,
    operation,
    payload: snapshot ?? fallback ?? { id },
  });
}
