import type { SQLiteDatabase } from 'expo-sqlite';

import { serializeSyncPayload } from '../../features/sync/helpers';
import type { SyncQueueChange, SyncQueueInput, SyncState } from '../../features/sync/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';

const metadataKeys = {
  clientId: 'clientId',
  lastPulledAt: 'lastPulledAt',
  lastPushedAt: 'lastPushedAt',
  syncEnabled: 'syncEnabled',
} as const;

export const syncRepository = {
  async enqueueChange(db: SQLiteDatabase, input: SyncQueueInput) {
    const timestamp = input.changedAt ?? nowIso();

    await db.runAsync(
      `INSERT INTO sync_queue (
        id, entityType, entityId, operation, payload, status, attempts, lastError, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
      createId('sync'),
      input.entityType,
      input.entityId,
      input.operation,
      serializeSyncPayload(input.payload),
      timestamp,
      timestamp
    );
  },

  getPendingChanges(db: SQLiteDatabase, limit = 100) {
    return db.getAllAsync<SyncQueueChange>(
      `SELECT * FROM sync_queue
       WHERE status IN ('pending', 'failed')
       ORDER BY createdAt ASC
       LIMIT ?`,
      limit
    );
  },

  async markPushed(db: SQLiteDatabase, ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    const timestamp = nowIso();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const id of ids) {
        await txn.runAsync(
          `UPDATE sync_queue
           SET status = 'pushed', updatedAt = ?, lastError = NULL
           WHERE id = ?`,
          timestamp,
          id
        );
      }
    });

    await this.setMetadata(db, metadataKeys.lastPushedAt, timestamp);
  },

  async markFailed(db: SQLiteDatabase, id: string, error: string) {
    await db.runAsync(
      `UPDATE sync_queue
       SET status = 'failed', attempts = attempts + 1, lastError = ?, updatedAt = ?
       WHERE id = ?`,
      error,
      nowIso(),
      id
    );
  },

  async getMetadata(db: SQLiteDatabase) {
    const rows = await db.getAllAsync<{ key: string; value: string | null }>(
      `SELECT key, value FROM sync_metadata`
    );

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },

  async setMetadata(db: SQLiteDatabase, key: string, value: string | null) {
    await db.runAsync(
      `INSERT INTO sync_metadata (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  },

  async ensureClientId(db: SQLiteDatabase) {
    const metadata = await this.getMetadata(db);
    if (metadata.clientId) {
      return metadata.clientId;
    }

    const clientId = createId('client');
    await this.setMetadata(db, metadataKeys.clientId, clientId);
    await this.setMetadata(db, metadataKeys.syncEnabled, 'false');
    return clientId;
  },

  async getQueueStats(db: SQLiteDatabase) {
    const rows = await db.getAllAsync<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count
       FROM sync_queue
       GROUP BY status`
    );

    return rows.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.status] = row.count;
      return accumulator;
    }, {});
  },

  async getState(db: SQLiteDatabase): Promise<SyncState> {
    const clientId = await this.ensureClientId(db);
    const [metadata, stats] = await Promise.all([this.getMetadata(db), this.getQueueStats(db)]);

    return {
      clientId,
      lastPulledAt: metadata.lastPulledAt ?? null,
      lastPushedAt: metadata.lastPushedAt ?? null,
      syncEnabled: metadata.syncEnabled === 'true',
      pendingChanges: stats.pending ?? 0,
      failedChanges: stats.failed ?? 0,
    };
  },
};
