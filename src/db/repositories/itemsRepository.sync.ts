import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '../../features/items/types';
import type { SyncOperation, SyncQueueBatchMetadata } from '../../features/sync/types';
import { createId } from '../../utils/id';
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
  fallback?: unknown,
  batch?: SyncQueueBatchMetadata
) {
  const snapshot = await getItemSnapshot(db, id);
  await syncRepository.enqueueChange(db, {
    entityType: 'item',
    entityId: id,
    operation,
    payload: snapshot ?? fallback ?? { id },
    batch,
  });
}

export async function enqueueItemSnapshots(db: SQLiteDatabase, ids: string[], operation: SyncOperation) {
  const uniqueIds = Array.from(new Set(ids));
  const batchId = uniqueIds.length > 1 ? createId('sync_batch') : null;

  for (const [index, id] of uniqueIds.entries()) {
    await enqueueItemSnapshot(
      db,
      id,
      operation,
      undefined,
      batchId
        ? {
            id: batchId,
            index,
            size: uniqueIds.length,
            reason: `${operation}_items`,
          }
        : undefined
    );
  }
}
