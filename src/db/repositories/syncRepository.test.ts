import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it } from 'vitest';

import { parseSyncPayload } from '../../features/sync/helpers';
import type { SyncOperation, SyncQueueChange, SyncQueuePayload, SyncQueueStatus } from '../../features/sync/types';
import { syncRepository } from './syncRepository';

class SyncRepositoryTestDb {
  rows: SyncQueueChange[] = [];
  metadata: Record<string, string | null> = {};

  async getFirstAsync<T>(query: string, ...params: unknown[]) {
    if (query.includes('FROM sync_queue')) {
      const [entityType, entityId] = params;
      const row = this.rows
        .filter((change) => change.entityType === entityType && change.entityId === entityId)
        .filter((change) => change.status === 'pending' || change.status === 'failed')
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];

      return (row ? { id: row.id, operation: row.operation } : null) as T | null;
    }

    return null as T | null;
  }

  async getAllAsync<T>(query: string, ...params: unknown[]) {
    if (query.includes('GROUP BY status')) {
      const counts = this.rows.reduce<Record<string, number>>((accumulator, row) => {
        accumulator[row.status] = (accumulator[row.status] ?? 0) + 1;
        return accumulator;
      }, {});

      return Object.entries(counts).map(([status, count]) => ({ status, count })) as T[];
    }

    if (query.includes('FROM sync_metadata')) {
      return Object.entries(this.metadata).map(([key, value]) => ({ key, value })) as T[];
    }

    if (query.includes('FROM sync_queue')) {
      const limit = Number(params[0] ?? 20);
      return [...this.rows]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit) as T[];
    }

    return [] as T[];
  }

  async runAsync(query: string, ...params: unknown[]) {
    if (query.includes('INSERT INTO sync_queue')) {
      const [id, entityType, entityId, operation, payload, createdAt, updatedAt] = params;
      this.rows.push({
        id: String(id),
        entityType: entityType as SyncQueueChange['entityType'],
        entityId: String(entityId),
        operation: operation as SyncOperation,
        payload: String(payload),
        status: 'pending',
        attempts: 0,
        lastError: null,
        createdAt: String(createdAt),
        updatedAt: String(updatedAt),
      });
      return;
    }

    if (query.includes('SET operation = ?')) {
      const [operation, payload, updatedAt, id] = params;
      const row = this.rows.find((change) => change.id === id);
      if (row) {
        row.operation = operation as SyncOperation;
        row.payload = String(payload);
        row.status = 'pending';
        row.attempts = 0;
        row.lastError = null;
        row.updatedAt = String(updatedAt);
      }
      return;
    }

    if (query.includes("SET status = 'pushed'")) {
      const [updatedAt, id] = params;
      const row = this.rows.find((change) => change.id === id);
      if (row) {
        row.status = 'pushed';
        row.lastError = null;
        row.updatedAt = String(updatedAt);
      }
      return;
    }

    if (query.includes("SET status = 'failed'")) {
      const [lastError, updatedAt, id] = params;
      const row = this.rows.find((change) => change.id === id);
      if (row) {
        row.status = 'failed';
        row.attempts += 1;
        row.lastError = String(lastError);
        row.updatedAt = String(updatedAt);
      }
      return;
    }

    if (query.includes('INSERT INTO sync_metadata')) {
      const [key, value] = params;
      this.metadata[String(key)] = value === null ? null : String(value);
      return;
    }

    if (query.includes('DELETE FROM sync_queue')) {
      const [olderThanIso, limit] = params;
      const idsToRemove = this.rows
        .filter((change) => change.status === 'pushed' && change.updatedAt < String(olderThanIso))
        .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
        .slice(0, Number(limit))
        .map((change) => change.id);

      this.rows = this.rows.filter((change) => !idsToRemove.includes(change.id));
    }
  }

  async withExclusiveTransactionAsync(callback: (txn: SQLiteDatabase) => Promise<void>) {
    await callback(this as unknown as SQLiteDatabase);
  }
}

function asDb(db: SyncRepositoryTestDb) {
  return db as unknown as SQLiteDatabase;
}

function getPayload<TSnapshot>(change: SyncQueueChange) {
  return parseSyncPayload<SyncQueuePayload<TSnapshot>>(change.payload);
}

describe('syncRepository', () => {
  it('coalesces multiple updates for the same entity into one final payload', async () => {
    const db = new SyncRepositoryTestDb();

    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'item',
      entityId: 'item-1',
      operation: 'update',
      payload: { id: 'item-1', title: 'First title' },
      changedAt: '2026-04-21T10:00:00.000Z',
    });
    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'item',
      entityId: 'item-1',
      operation: 'update',
      payload: { id: 'item-1', title: 'Final title' },
      changedAt: '2026-04-21T11:00:00.000Z',
    });

    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].operation).toBe('update');
    expect(getPayload<{ title: string }>(db.rows[0]).snapshot.title).toBe('Final title');
    expect(getPayload(db.rows[0]).changedAt).toBe('2026-04-21T11:00:00.000Z');
  });

  it('keeps create as the final operation when a new local entity is updated before push', async () => {
    const db = new SyncRepositoryTestDb();

    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'list',
      entityId: 'list-1',
      operation: 'create',
      payload: { id: 'list-1', name: 'Inbox' },
      changedAt: '2026-04-21T10:00:00.000Z',
    });
    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'list',
      entityId: 'list-1',
      operation: 'update',
      payload: { id: 'list-1', name: 'Personal' },
      changedAt: '2026-04-21T11:00:00.000Z',
    });

    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].operation).toBe('create');
    expect(getPayload<{ name: string }>(db.rows[0]).snapshot.name).toBe('Personal');
  });

  it('resets a failed coalesced row back to pending after a new local change', async () => {
    const db = new SyncRepositoryTestDb();

    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'settings',
      entityId: 'themeId',
      operation: 'update',
      payload: { key: 'themeId', value: 'cyber' },
    });
    db.rows[0].status = 'failed' as SyncQueueStatus;
    db.rows[0].attempts = 2;
    db.rows[0].lastError = 'Network error';

    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'settings',
      entityId: 'themeId',
      operation: 'update',
      payload: { key: 'themeId', value: 'aurora' },
    });

    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].status).toBe('pending');
    expect(db.rows[0].attempts).toBe(0);
    expect(db.rows[0].lastError).toBeNull();
    expect(getPayload<{ value: string }>(db.rows[0]).snapshot.value).toBe('aurora');
  });

  it('stores batch metadata inside the sync payload envelope', async () => {
    const db = new SyncRepositoryTestDb();

    await syncRepository.enqueueChange(asDb(db), {
      entityType: 'item',
      entityId: 'item-1',
      operation: 'update',
      payload: { id: 'item-1' },
      batch: {
        id: 'batch-1',
        index: 1,
        size: 3,
        reason: 'update_items',
      },
      changedAt: '2026-04-21T12:00:00.000Z',
    });

    expect(getPayload(db.rows[0]).batch).toEqual({
      id: 'batch-1',
      index: 1,
      size: 3,
      reason: 'update_items',
    });
  });

  it('prunes old pushed changes but keeps fresh pushed and active rows', async () => {
    const db = new SyncRepositoryTestDb();
    db.rows = [
      makeRow('old-pushed', 'pushed', '2026-03-01T10:00:00.000Z'),
      makeRow('fresh-pushed', 'pushed', '2026-04-20T10:00:00.000Z'),
      makeRow('pending', 'pending', '2026-03-01T10:00:00.000Z'),
    ];

    await syncRepository.prunePushedChanges(asDb(db), '2026-04-01T00:00:00.000Z');

    expect(db.rows.map((row) => row.id)).toEqual(['fresh-pushed', 'pending']);
  });
});

function makeRow(id: string, status: SyncQueueStatus, updatedAt: string): SyncQueueChange {
  return {
    id,
    entityType: 'item',
    entityId: id,
    operation: 'update',
    payload: '{}',
    status,
    attempts: 0,
    lastError: null,
    createdAt: updatedAt,
    updatedAt,
  };
}
