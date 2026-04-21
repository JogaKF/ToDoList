export type SyncEntityType =
  | 'list'
  | 'item'
  | 'settings'
  | 'shopping_category'
  | 'shopping_favorite'
  | 'shopping_dictionary_product';

export type SyncOperation = 'create' | 'update' | 'delete' | 'restore' | 'purge';

export type SyncQueueStatus = 'pending' | 'pushed' | 'failed';

export type SyncQueueChange = {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  status: SyncQueueStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncQueueInput = {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload?: unknown;
  changedAt?: string;
};

export type SyncState = {
  clientId: string;
  lastPulledAt: string | null;
  lastPushedAt: string | null;
  syncEnabled: boolean;
  pendingChanges: number;
  failedChanges: number;
};

export type RemoteChangeEnvelope<TPayload = unknown> = {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: TPayload;
  updatedAt: string;
};

export type SyncTransport = {
  pushChanges: (changes: SyncQueueChange[]) => Promise<{ acceptedIds?: string[] }>;
  pullChanges: (input: {
    clientId: string;
    lastPulledAt: string | null;
  }) => Promise<{
    changes: RemoteChangeEnvelope[];
    pulledAt: string;
  }>;
};

export type SyncRunSummary = {
  status: 'skipped' | 'pushed' | 'pulled' | 'synced' | 'failed';
  pendingChanges: number;
  pushedChanges: number;
  pulledChanges: number;
  message: string | null;
};
