import type { SQLiteDatabase } from 'expo-sqlite';

import { syncRepository } from '../../db/repositories/syncRepository';
import type { SyncRunSummary, SyncTransport } from './types';

function skippedSummary(pendingChanges: number, message: string): SyncRunSummary {
  return {
    status: 'skipped',
    pendingChanges,
    pushedChanges: 0,
    pulledChanges: 0,
    message,
  };
}

export const syncService = {
  getState(db: SQLiteDatabase) {
    return syncRepository.getState(db);
  },

  async pushPendingChanges(db: SQLiteDatabase, transport?: SyncTransport): Promise<SyncRunSummary> {
    const pendingChanges = await syncRepository.getPendingChanges(db);
    if (!transport) {
      return skippedSummary(pendingChanges.length, 'Sync transport is not configured yet.');
    }

    if (pendingChanges.length === 0) {
      return {
        status: 'pushed',
        pendingChanges: 0,
        pushedChanges: 0,
        pulledChanges: 0,
        message: null,
      };
    }

    try {
      const result = await transport.pushChanges(pendingChanges);
      const acceptedIds = result.acceptedIds ?? pendingChanges.map((change) => change.id);
      await syncRepository.markPushed(db, acceptedIds);

      return {
        status: 'pushed',
        pendingChanges: Math.max(0, pendingChanges.length - acceptedIds.length),
        pushedChanges: acceptedIds.length,
        pulledChanges: 0,
        message: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync push error.';
      for (const change of pendingChanges) {
        await syncRepository.markFailed(db, change.id, message);
      }

      return {
        status: 'failed',
        pendingChanges: pendingChanges.length,
        pushedChanges: 0,
        pulledChanges: 0,
        message,
      };
    }
  },

  async pullChanges(db: SQLiteDatabase, transport?: SyncTransport): Promise<SyncRunSummary> {
    const state = await syncRepository.getState(db);
    if (!transport) {
      return skippedSummary(state.pendingChanges + state.failedChanges, 'Sync transport is not configured yet.');
    }

    try {
      const result = await transport.pullChanges({
        clientId: state.clientId,
        lastPulledAt: state.lastPulledAt,
      });
      await syncRepository.setMetadata(db, 'lastPulledAt', result.pulledAt);

      return {
        status: 'pulled',
        pendingChanges: state.pendingChanges + state.failedChanges,
        pushedChanges: 0,
        pulledChanges: result.changes.length,
        message: 'Remote changes are fetched but not applied until backend mapping is implemented.',
      };
    } catch (error) {
      return {
        status: 'failed',
        pendingChanges: state.pendingChanges + state.failedChanges,
        pushedChanges: 0,
        pulledChanges: 0,
        message: error instanceof Error ? error.message : 'Unknown sync pull error.',
      };
    }
  },

  async syncNow(db: SQLiteDatabase, transport?: SyncTransport): Promise<SyncRunSummary> {
    const pushed = await this.pushPendingChanges(db, transport);
    if (pushed.status === 'failed' || pushed.status === 'skipped') {
      return pushed;
    }

    const pulled = await this.pullChanges(db, transport);
    return {
      status: pulled.status === 'failed' ? 'failed' : 'synced',
      pendingChanges: pulled.pendingChanges,
      pushedChanges: pushed.pushedChanges,
      pulledChanges: pulled.pulledChanges,
      message: pulled.message,
    };
  },
};
