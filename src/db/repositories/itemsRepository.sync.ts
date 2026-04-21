import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '../../features/items/types';
import type { SyncOperation } from '../../features/sync/types';
import { syncRepository } from './syncRepository';

export function getItemSnapshot(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Item>(
    `SELECT * FROM items WHERE id = ?`,
    id
  );
}

export async function enqueueItemSnapshot(
  db: SQLiteDatabase,
  id: string,
  operation: SyncOperation,
  fallback?: unknown
) {
  const snapshot = await getItemSnapshot(db, id);
  await syncRepository.enqueueChange(db, {
    entityType: 'item',
    entityId: id,
    operation,
    payload: snapshot ?? fallback ?? { id },
  });
}

export async function enqueueItemSnapshots(db: SQLiteDatabase, ids: string[], operation: SyncOperation) {
  const uniqueIds = Array.from(new Set(ids));
  for (const id of uniqueIds) {
    await enqueueItemSnapshot(db, id, operation);
  }
}
