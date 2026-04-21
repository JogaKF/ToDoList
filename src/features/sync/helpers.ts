import { nowIso } from '../../utils/date';
import type { SyncOperation, SyncQueueInput, SyncQueuePayload } from './types';

type TimestampedEntity = {
  updatedAt?: string | null;
  deletedAt?: string | null;
};

export function serializeSyncPayload(payload: unknown) {
  return JSON.stringify(payload ?? {});
}

export function parseSyncPayload<TPayload = unknown>(raw: string): TPayload {
  return JSON.parse(raw) as TPayload;
}

export function isRemoteNewer(
  local: TimestampedEntity | null | undefined,
  remote: TimestampedEntity | null | undefined
) {
  const localTimestamp = local?.deletedAt ?? local?.updatedAt ?? '';
  const remoteTimestamp = remote?.deletedAt ?? remote?.updatedAt ?? '';

  return remoteTimestamp > localTimestamp;
}

export function resolveLastWriteWins<TLocal extends TimestampedEntity, TRemote extends TimestampedEntity>(
  local: TLocal | null,
  remote: TRemote
) {
  return isRemoteNewer(local, remote) ? remote : local;
}

export function buildSyncMetadataDefaults(clientId: string) {
  return {
    clientId,
    lastPulledAt: null,
    lastPushedAt: null,
    syncEnabled: false,
    createdAt: nowIso(),
  };
}

export function buildSyncQueuePayload(
  input: SyncQueueInput,
  changedAt: string
): SyncQueuePayload {
  return {
    version: 1,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    changedAt,
    snapshot: input.payload ?? { id: input.entityId },
    batch: input.batch,
  };
}

export function coalesceSyncOperation(current: SyncOperation, next: SyncOperation): SyncOperation {
  if (current === 'purge' || next === 'purge') {
    return 'purge';
  }

  if (next === 'delete') {
    return 'delete';
  }

  if (next === 'restore') {
    return current === 'create' ? 'create' : 'restore';
  }

  if (next === 'update') {
    if (current === 'create' || current === 'restore' || current === 'delete') {
      return current;
    }

    return 'update';
  }

  return current === 'delete' ? 'delete' : 'create';
}

export function getPushedRetentionCutoff(days: number, referenceDate = new Date()) {
  const cutoff = new Date(referenceDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}
