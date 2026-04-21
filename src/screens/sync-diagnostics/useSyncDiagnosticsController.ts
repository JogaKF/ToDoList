import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDatabase } from '../../db/sqlite';
import { syncRepository } from '../../db/repositories/syncRepository';
import type { SyncQueueChange, SyncState } from '../../features/sync/types';

export function useSyncDiagnosticsController() {
  const db = useAppDatabase();
  const [state, setState] = useState<SyncState | null>(null);
  const [recentChanges, setRecentChanges] = useState<SyncQueueChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [nextState, nextRecentChanges] = await Promise.all([
      syncRepository.getState(db),
      syncRepository.getRecentChanges(db, 25),
    ]);
    setState(nextState);
    setRecentChanges(nextRecentChanges);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return {
    state,
    recentChanges,
    isLoading,
    refresh,
  };
}
