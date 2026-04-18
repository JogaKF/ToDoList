import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { useAppDatabase } from '../../db/sqlite';
import { itemsService } from '../../features/items/service';
import type { DeletedItem } from '../../features/items/types';
import { listsService } from '../../features/lists/service';
import type { DeletedTodoList } from '../../features/lists/types';
import { buildDeletedItemBranches } from './helpers';

export function useTrashController() {
  const db = useAppDatabase();
  const { mutationTick } = useRecovery();
  const [deletedLists, setDeletedLists] = useState<DeletedTodoList[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextLists, nextItems] = await Promise.all([listsService.getDeleted(db), itemsService.getDeleted(db)]);

    setDeletedLists(nextLists);
    setDeletedItems(nextItems);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void loadData();
  }, [loadData, mutationTick]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const deletedListSummaries = useMemo(
    () =>
      deletedLists.map((list) => {
        const relatedItems = deletedItems.filter((item) => item.listId === list.id);
        return {
          ...list,
          itemCount: relatedItems.length,
        };
      }),
    [deletedItems, deletedLists]
  );

  const deletedItemBranches = useMemo(() => buildDeletedItemBranches(deletedItems), [deletedItems]);

  const confirmDeleteListForever = useCallback(
    (list: DeletedTodoList & { itemCount: number }) => {
      Alert.alert(
        'Usunac z kosza na stale?',
        list.itemCount > 0
          ? `Ta lista zniknie bezpowrotnie razem z ${list.itemCount} elementami.`
          : 'Ta lista zniknie bezpowrotnie z lokalnej bazy.',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Usun na stale',
            style: 'destructive',
            onPress: () => {
              void listsService.hardDelete(db, list.id).then(loadData);
            },
          },
        ]
      );
    },
    [db, loadData]
  );

  const confirmDeleteBranchForever = useCallback(
    (branch: ReturnType<typeof buildDeletedItemBranches>[number]) => {
      Alert.alert(
        'Usunac z kosza na stale?',
        branch.totalItems === 1
          ? 'Ten element zniknie bezpowrotnie z lokalnej bazy.'
          : `Ta galaz zniknie bezpowrotnie razem z ${branch.totalItems} elementami.`,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Usun na stale',
            style: 'destructive',
            onPress: () => {
              void itemsService.hardDelete(db, branch.root.id).then(loadData);
            },
          },
        ]
      );
    },
    [db, loadData]
  );

  const confirmClearTrash = useCallback(() => {
    Alert.alert(
      'Oproznic kosz?',
      'Wszystkie usuniete listy i elementy znikna bezpowrotnie z lokalnej bazy.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Oproznij kosz',
          style: 'destructive',
          onPress: () => {
            void listsService.hardDeleteAllDeleted(db).then(loadData);
          },
        },
      ]
    );
  }, [db, loadData]);

  return {
    deletedLists,
    deletedItems,
    deletedListSummaries,
    deletedItemBranches,
    isLoading,
    loadData,
    confirmDeleteListForever,
    confirmDeleteBranchForever,
    confirmClearTrash,
  };
}
