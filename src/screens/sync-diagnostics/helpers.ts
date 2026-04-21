import { parseSyncPayload } from '../../features/sync/helpers';
import type { SyncQueuePayload, SyncQueueStatus } from '../../features/sync/types';

type PayloadPreview = Partial<SyncQueuePayload> & {
  title?: string;
  name?: string;
  key?: string;
  id?: string;
  snapshot?: {
    title?: string;
    name?: string;
    key?: string;
    id?: string;
  };
};

export function formatSyncDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getSyncPayloadSummary(rawPayload: string) {
  try {
    const payload = parseSyncPayload<PayloadPreview>(rawPayload);
    const snapshot = payload.snapshot;
    const label =
      snapshot?.title ??
      snapshot?.name ??
      snapshot?.key ??
      snapshot?.id ??
      payload.title ??
      payload.name ??
      payload.key ??
      payload.id ??
      payload.entityId ??
      'payload';

    if (payload.batch) {
      return `${label} • batch ${payload.batch.index + 1}/${payload.batch.size} • ${payload.batch.reason}`;
    }

    return String(label);
  } catch {
    return 'Nie mozna odczytac payloadu';
  }
}

export function getSyncStatusLabel(status: SyncQueueStatus) {
  if (status === 'pending') {
    return 'Pending';
  }

  if (status === 'failed') {
    return 'Failed';
  }

  return 'Pushed';
}
