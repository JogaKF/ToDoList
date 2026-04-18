import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { useAppDatabase } from '../../db/sqlite';
import { itemsService } from '../../features/items/service';
import { listsService } from '../../features/lists/service';
import type {
  Item,
  ItemActivity,
  ItemRelations,
  SeriesEditScope,
  ShoppingCategory,
  ShoppingFavorite,
} from '../../features/items/types';
import type { TodoList } from '../../features/lists/types';
import { compareDateKeys, todayKey } from '../../utils/date';
import { defaultShoppingCategories } from './constants';
import { buildEditorState, type TaskEditorState } from './helpers';

type UseTaskPreviewControllerParams = {
  itemId: string;
};

export function useTaskPreviewController({ itemId }: UseTaskPreviewControllerParams) {
  const db = useAppDatabase();
  const { pushUndoAction, mutationTick } = useRecovery();
  const [item, setItem] = useState<Item | null>(null);
  const [sourceList, setSourceList] = useState<TodoList | null>(null);
  const [relations, setRelations] = useState<ItemRelations>({ parent: null, children: [] });
  const [activity, setActivity] = useState<ItemActivity[]>([]);
  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([]);
  const [shoppingFavorites, setShoppingFavorites] = useState<ShoppingFavorite[]>([]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [draft, setDraft] = useState<TaskEditorState>(buildEditorState());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveScope, setSaveScope] = useState<SeriesEditScope>('single');

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    const nextItem = await itemsService.getById(db, itemId);
    setItem(nextItem ?? null);
    setDraft(buildEditorState(nextItem ?? null));
    if (nextItem) {
      const [nextList, nextRelations, nextActivity] = await Promise.all([
        listsService.getById(db, nextItem.listId),
        itemsService.getRelations(db, nextItem.id),
        itemsService.getActivity(db, nextItem.id),
      ]);
      setSourceList(nextList ?? null);
      setRelations(nextRelations);
      setActivity(nextActivity);
      if (nextItem.type === 'shopping') {
        const [nextCategories, nextFavorites] = await Promise.all([
          itemsService.getShoppingCategories(db),
          itemsService.getShoppingFavorites(db),
        ]);
        setShoppingCategories(nextCategories);
        setShoppingFavorites(nextFavorites);
      } else {
        setShoppingCategories([]);
        setShoppingFavorites([]);
      }
    } else {
      setSourceList(null);
      setRelations({ parent: null, children: [] });
      setActivity([]);
      setShoppingCategories([]);
      setShoppingFavorites([]);
    }
    setIsLoading(false);
    setErrorMessage(null);
  }, [db, itemId]);

  useEffect(() => {
    void loadItem();
  }, [loadItem, mutationTick]);

  useFocusEffect(
    useCallback(() => {
      void loadItem();
    }, [loadItem])
  );

  const isTask = item?.type === 'task';
  const allShoppingCategoryNames = useMemo(() => {
    const merged = [...defaultShoppingCategories, ...shoppingCategories.map((category) => category.name)];
    return Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
  }, [shoppingCategories]);
  const isFavoriteShoppingItem = useMemo(
    () =>
      Boolean(
        item &&
          item.type === 'shopping' &&
          shoppingFavorites.some(
            (favorite) =>
              favorite.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
              (favorite.category?.trim().toLowerCase() ?? '') === (item.category?.trim().toLowerCase() ?? '') &&
              (favorite.quantity?.trim() ?? '') === (item.quantity?.trim() ?? '') &&
              (favorite.unit?.trim() ?? '') === (item.unit?.trim() ?? '')
          )
      ),
    [item, shoppingFavorites]
  );
  const isRecurringOverdue = useMemo(
    () =>
      Boolean(
        item &&
          item.type === 'task' &&
          item.recurrenceType !== 'none' &&
          item.status === 'todo' &&
          item.dueDate &&
          compareDateKeys(item.dueDate, todayKey()) < 0
      ),
    [item]
  );
  const recurringPreview = useMemo(() => (item ? itemsService.getRecurringPreview(item, 4) : []), [item]);

  const handleRescheduleRecurring = useCallback(
    async (dateKey: string, scope: SeriesEditScope) => {
      if (!item) {
        return;
      }

      await itemsService.updateDueDate(db, item.id, dateKey, scope);
      await loadItem();
      setSaveMessage(
        scope === 'series'
          ? `Przestawiono cala serie na ${dateKey}.`
          : `Przestawiono to wystapienie na ${dateKey}.`
      );
    },
    [db, item, loadItem]
  );

  const handleSave = useCallback(async () => {
    if (!item) {
      return;
    }

    const nextTitle = draft.title.trim();
    if (!nextTitle) {
      setErrorMessage('Tytul nie moze byc pusty.');
      setSaveMessage(null);
      return;
    }

    if (isTask && draft.dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate.trim())) {
      setErrorMessage('Data zadania musi miec format YYYY-MM-DD.');
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    await itemsService.updateDetails(
      db,
      item.id,
      {
        title: nextTitle,
        category: item.type === 'shopping' ? draft.category : null,
        quantity: draft.quantity,
        unit: draft.unit,
        note: draft.note,
        dueDate: isTask ? draft.dueDate.trim() || null : null,
        recurrenceType: isTask ? draft.recurrenceType : 'none',
        recurrenceInterval: Number.parseInt(draft.recurrenceInterval, 10) || 1,
        recurrenceUnit: draft.recurrenceUnit,
      },
      saveScope
    );
    await loadItem();
    setIsSaving(false);
    setErrorMessage(null);
    setSaveMessage(saveScope === 'series' ? 'Zmiany zapisaly sie dla calej serii.' : 'Zmiany zapisaly sie lokalnie.');
  }, [db, draft, isTask, item, loadItem, saveScope]);

  const handleReset = useCallback(() => {
    setDraft(buildEditorState(item));
    setErrorMessage(null);
    setSaveMessage(null);
  }, [item]);

  const handleToggleDone = useCallback(async () => {
    if (!item) {
      return;
    }

    await itemsService.toggleDone(db, item);
    pushUndoAction({
      id: `toggle-item-${item.id}-${Date.now()}`,
      label:
        item.status === 'done'
          ? `Cofnieto ukonczenie: ${item.title}`
          : `Zmieniono status zadania: ${item.title}`,
      perform: async (undoDb) => {
        const latestItem = await itemsService.getById(undoDb, item.id);
        if (!latestItem) {
          return;
        }
        await itemsService.toggleDone(undoDb, latestItem);
      },
    });
    await loadItem();
    setSaveMessage(item.status === 'done' ? 'Zadanie wrocilo do aktywnych.' : 'Status zadania zostal zaktualizowany.');
  }, [db, item, loadItem, pushUndoAction]);

  const handleSetMyDayDate = useCallback(
    async (dateKey: string | null) => {
      if (!item) {
        return;
      }

      if (dateKey) {
        await itemsService.addToMyDay(db, item.id, dateKey);
      } else {
        await itemsService.removeFromMyDay(db, item.id);
      }

      await loadItem();
      setSaveMessage(dateKey ? 'Zadanie zostalo zaplanowane.' : 'Zadanie usunieto z Mojego dnia.');
    },
    [db, item, loadItem]
  );

  const handleAddCustomCategory = useCallback(async () => {
    const nextName = customCategoryName.trim();
    if (!nextName) {
      return;
    }

    await itemsService.addShoppingCategory(db, nextName);
    setDraft((current) => ({
      ...current,
      category: nextName,
    }));
    setCustomCategoryName('');
    const nextCategories = await itemsService.getShoppingCategories(db);
    setShoppingCategories(nextCategories);
  }, [customCategoryName, db]);

  const handleToggleShoppingFavorite = useCallback(async () => {
    if (!item || item.type !== 'shopping') {
      return;
    }

    const payload = {
      title: draft.title.trim() || item.title,
      category: draft.category || null,
      quantity: draft.quantity || null,
      unit: draft.unit || null,
    };

    if (isFavoriteShoppingItem) {
      await itemsService.removeShoppingFavorite(db, payload);
      setSaveMessage('Produkt usunieto z ulubionych.');
    } else {
      await itemsService.saveShoppingFavorite(db, payload);
      setSaveMessage('Produkt dodano do ulubionych.');
    }

    const nextFavorites = await itemsService.getShoppingFavorites(db);
    setShoppingFavorites(nextFavorites);
  }, [db, draft.category, draft.quantity, draft.title, draft.unit, isFavoriteShoppingItem, item]);

  const updateDraft = useCallback(<Key extends keyof TaskEditorState>(key: Key, value: TaskEditorState[Key]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  return {
    item,
    sourceList,
    relations,
    activity,
    draft,
    isTask,
    isLoading,
    isSaving,
    saveMessage,
    errorMessage,
    saveScope,
    setSaveScope,
    customCategoryName,
    setCustomCategoryName,
    allShoppingCategoryNames,
    isFavoriteShoppingItem,
    isRecurringOverdue,
    recurringPreview,
    shoppingCategories,
    shoppingFavorites,
    updateDraft,
    setDraft,
    handleRescheduleRecurring,
    handleSave,
    handleReset,
    handleToggleDone,
    handleSetMyDayDate,
    handleAddCustomCategory,
    handleToggleShoppingFavorite,
  };
}
