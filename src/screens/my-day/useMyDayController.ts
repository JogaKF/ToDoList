import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { Swipeable } from 'react-native-gesture-handler';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { usePreferences } from '../../app/providers/PreferencesProvider';
import { useAppDatabase } from '../../db/sqlite';
import { collectExpandableIds } from '../../features/items/tree';
import { useTreeUiStore } from '../../features/items/useTreeUiStore';
import { listsService } from '../../features/lists/service';
import { myDayService } from '../../features/my-day/service';
import type { Item, ItemTreeNode } from '../../features/items/types';
import type { TodoList } from '../../features/lists/types';
import { todayKey } from '../../utils/date';
import { groupItemsByList } from './helpers';

export function useMyDayController() {
  const db = useAppDatabase();
  const { pushUndoAction, mutationTick, notifyMutation } = useRecovery();
  const { expandedIds, toggleExpanded, expandMany } = useTreeUiStore();
  const { showCompleted } = usePreferences();
  const [items, setItems] = useState<Item[]>([]);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [isLoading, setIsLoading] = useState(true);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextItems, nextLists] = await Promise.all([myDayService.getItems(db, selectedDate), listsService.getAll(db)]);

    setItems(nextItems);
    setLists(nextLists);
    setIsLoading(false);
  }, [db, selectedDate]);

  useEffect(() => {
    void loadData();
  }, [loadData, mutationTick]);

  const closeAllSwipeables = useCallback(() => {
    Object.values(swipeableRefs.current).forEach((swipeable) => {
      swipeable?.close();
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      closeAllSwipeables();
      void loadData();
      return () => {
        closeAllSwipeables();
      };
    }, [closeAllSwipeables, loadData])
  );

  const groupedItems = useMemo(() => groupItemsByList(items, lists), [items, lists]);

  useEffect(() => {
    const idsToExpand = groupedItems.flatMap((group) => collectExpandableIds(group.tree));
    if (idsToExpand.length > 0) {
      expandMany(idsToExpand);
    }
  }, [expandMany, groupedItems]);

  const handleToggleDone = useCallback(
    async (item: ItemTreeNode) => {
      await myDayService.toggleDone(db, item);
      pushUndoAction({
        id: `toggle-item-${item.id}-${Date.now()}`,
        label:
          item.status === 'done'
            ? `Cofnieto ukonczenie: ${item.title}`
            : `Zmieniono status zadania: ${item.title}`,
        perform: async (undoDb) => {
          const latestItem = await myDayService.getById(undoDb, item.id);
          if (!latestItem) {
            return;
          }
          await myDayService.toggleDone(undoDb, latestItem);
        },
      });
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation, pushUndoAction]
  );

  const handleRemoveFromDay = useCallback(
    async (itemId: string) => {
      closeAllSwipeables();
      await myDayService.removeFromDay(db, itemId);
      notifyMutation();
      await loadData();
    },
    [closeAllSwipeables, db, loadData, notifyMutation]
  );

  const handleMoveToDay = useCallback(
    async (itemId: string, dateKey: string) => {
      await myDayService.moveToDay(db, itemId, dateKey);
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation]
  );

  const registerSwipeable = useCallback((itemId: string, instance: Swipeable | null) => {
    swipeableRefs.current[itemId] = instance;
  }, []);

  return {
    groupedItems,
    expandedIds,
    toggleExpanded,
    showCompleted,
    selectedDate,
    setSelectedDate,
    isLoading,
    handleToggleDone,
    handleRemoveFromDay,
    handleMoveToDay,
    registerSwipeable,
  };
}
