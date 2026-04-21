import { nowIso } from '../../utils/date';

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
