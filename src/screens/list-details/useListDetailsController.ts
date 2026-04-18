import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Swipeable } from 'react-native-gesture-handler';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { usePreferences } from '../../app/providers/PreferencesProvider';
import { useAppDatabase } from '../../db/sqlite';
import { itemsService } from '../../features/items/service';
import { collectExpandableIds, flattenVisibleTree } from '../../features/items/tree';
import type {
  ItemTreeNode,
  RecurrenceType,
  RecurrenceUnit,
  ShoppingCategory,
  ShoppingFavorite,
  ShoppingHistoryEntry,
} from '../../features/items/types';
import { useTreeUiStore } from '../../features/items/useTreeUiStore';
import { listsService } from '../../features/lists/service';
import type { TodoList } from '../../features/lists/types';
import { defaultShoppingCategories } from './constants';
import {
  buildTemplateKey,
  groupShoppingItems,
  isValidDateKey,
  sortShoppingItems,
  type ShoppingGroupMode,
  type ShoppingSortMode,
  type ShoppingTemplate,
} from './helpers';

type UseListDetailsControllerParams = {
  listId: string;
  navigateToList: (listId: string) => void;
};

export function useListDetailsController({ listId, navigateToList }: UseListDetailsControllerParams) {
  const db = useAppDatabase();
  const { expandedIds, toggleExpanded, expandMany, collapseMany } = useTreeUiStore();
  const { pushUndoAction, mutationTick } = useRecovery();
  const { showCompleted, shoppingSortMode: defaultShoppingSortMode, shoppingGroupMode: defaultShoppingGroupMode } =
    usePreferences();

  const [list, setList] = useState<TodoList | null>(null);
  const [tree, setTree] = useState<ItemTreeNode[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [composerCategory, setComposerCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [composerQuantity, setComposerQuantity] = useState('');
  const [composerUnit, setComposerUnit] = useState('');
  const [showShoppingDetails, setShowShoppingDetails] = useState(false);
  const [showShoppingFavorites, setShowShoppingFavorites] = useState(false);
  const [showShoppingHistory, setShowShoppingHistory] = useState(false);
  const [showShoppingCategories, setShowShoppingCategories] = useState(false);
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<string | null>(null);
  const [composerNote, setComposerNote] = useState('');
  const [composerDueDate, setComposerDueDate] = useState('');
  const [composerRecurrenceType, setComposerRecurrenceType] = useState<RecurrenceType>('none');
  const [composerRecurrenceInterval, setComposerRecurrenceInterval] = useState('1');
  const [composerRecurrenceUnit, setComposerRecurrenceUnit] = useState<RecurrenceUnit>('weeks');
  const [showComposerDetails, setShowComposerDetails] = useState(false);
  const [shoppingSortMode, setShoppingSortMode] = useState<ShoppingSortMode>(defaultShoppingSortMode);
  const [shoppingGroupMode, setShoppingGroupMode] = useState<ShoppingGroupMode>(defaultShoppingGroupMode);
  const [draftChildren, setDraftChildren] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([]);
  const [shoppingFavorites, setShoppingFavorites] = useState<ShoppingFavorite[]>([]);
  const [shoppingHistory, setShoppingHistory] = useState<ShoppingHistoryEntry[]>([]);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const isShoppingList = list?.type === 'shopping';

  const visibleItems = useMemo(() => flattenVisibleTree(tree, expandedIds), [expandedIds, tree]);
  const taskOpenItems = useMemo(() => visibleItems.filter((item) => item.status === 'todo'), [visibleItems]);
  const taskDoneItems = useMemo(() => visibleItems.filter((item) => item.status === 'done'), [visibleItems]);
  const shoppingOpenItems = useMemo(() => visibleItems.filter((item) => item.status === 'todo'), [visibleItems]);
  const shoppingDoneItems = useMemo(() => visibleItems.filter((item) => item.status === 'done'), [visibleItems]);
  const sortedShoppingOpenItems = useMemo(
    () => sortShoppingItems(shoppingOpenItems, shoppingSortMode),
    [shoppingOpenItems, shoppingSortMode]
  );
  const sortedShoppingDoneItems = useMemo(
    () => sortShoppingItems(shoppingDoneItems, shoppingSortMode),
    [shoppingDoneItems, shoppingSortMode]
  );
  const shoppingOpenGroups = useMemo(
    () => groupShoppingItems(sortedShoppingOpenItems, shoppingGroupMode),
    [shoppingGroupMode, sortedShoppingOpenItems]
  );
  const shoppingDoneGroups = useMemo(
    () => groupShoppingItems(sortedShoppingDoneItems, shoppingGroupMode),
    [shoppingGroupMode, sortedShoppingDoneItems]
  );
  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree]);
  const listSummary = useMemo(() => {
    const doneItems = visibleItems.filter((item) => item.status === 'done').length;
    const openItems = visibleItems.length - doneItems;

    return {
      totalItems: visibleItems.length,
      doneItems,
      openItems,
    };
  }, [visibleItems]);
  const allShoppingCategoryNames = useMemo(() => {
    const merged = [...defaultShoppingCategories, ...shoppingCategories.map((category) => category.name)];
    return Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
  }, [shoppingCategories]);
  const shoppingTemplates = useMemo(() => {
    const deduped = new Map<string, ShoppingTemplate>();
    [...shoppingFavorites, ...shoppingHistory].forEach((template) => {
      const key = buildTemplateKey(template);
      if (!deduped.has(key)) {
        deduped.set(key, {
          title: template.title,
          category: template.category,
          quantity: template.quantity,
          unit: template.unit,
        });
      }
    });

    return [...deduped.values()];
  }, [shoppingFavorites, shoppingHistory]);
  const shoppingSuggestions = useMemo(() => {
    const query = newTaskTitle.trim().toLowerCase();
    if (!isShoppingList || query.length < 2 || /[,;\n]/.test(newTaskTitle)) {
      return [];
    }

    return shoppingTemplates.filter((template) => template.title.toLowerCase().includes(query)).slice(0, 6);
  }, [isShoppingList, newTaskTitle, shoppingTemplates]);
  const browseCategoryTemplates = useMemo(() => {
    if (!selectedBrowseCategory) {
      return [];
    }

    return shoppingTemplates.filter(
      (template) => (template.category?.trim().toLowerCase() ?? '') === selectedBrowseCategory.trim().toLowerCase()
    );
  }, [selectedBrowseCategory, shoppingTemplates]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextList, nextTree, nextCategories, nextFavorites, nextHistory] = await Promise.all([
      listsService.getById(db, listId),
      itemsService.getListTree(db, listId),
      itemsService.getShoppingCategories(db),
      itemsService.getShoppingFavorites(db),
      itemsService.getShoppingHistory(db),
    ]);

    setList(nextList ?? null);
    setTree(nextTree);
    setShoppingCategories(nextCategories);
    setShoppingFavorites(nextFavorites);
    setShoppingHistory(nextHistory);
    setIsLoading(false);
  }, [db, listId]);

  useEffect(() => {
    void loadData();
  }, [loadData, mutationTick]);

  useEffect(() => {
    setShoppingSortMode(defaultShoppingSortMode);
  }, [defaultShoppingSortMode]);

  useEffect(() => {
    setShoppingGroupMode(defaultShoppingGroupMode);
  }, [defaultShoppingGroupMode]);

  const closeAllSwipeables = useCallback(() => {
    Object.values(swipeableRefs.current).forEach((swipeable) => {
      swipeable?.close();
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      closeAllSwipeables();
      setSelectedItemId(null);
      setTree([]);
      void loadData();

      return () => {
        closeAllSwipeables();
        setSelectedItemId(null);
        setTree([]);
      };
    }, [closeAllSwipeables, loadData])
  );

  const isFavoriteShoppingEntry = useCallback(
    (input: Pick<ShoppingFavorite, 'title' | 'category' | 'quantity' | 'unit'>) =>
      shoppingFavorites.some(
        (favorite) =>
          favorite.title.trim().toLowerCase() === input.title.trim().toLowerCase() &&
          (favorite.category?.trim().toLowerCase() ?? '') === (input.category?.trim().toLowerCase() ?? '') &&
          (favorite.quantity?.trim() ?? '') === (input.quantity?.trim() ?? '') &&
          (favorite.unit?.trim() ?? '') === (input.unit?.trim() ?? '')
      ),
    [shoppingFavorites]
  );

  const handleAddCustomCategory = useCallback(async () => {
    const nextName = customCategoryName.trim();
    if (!nextName) {
      return;
    }

    await itemsService.addShoppingCategory(db, nextName);
    setComposerCategory(nextName);
    setCustomCategoryName('');
    await loadData();
  }, [customCategoryName, db, loadData]);

  const handleCreateFromShoppingTemplate = useCallback(
    async (template: Pick<ShoppingHistoryEntry, 'title' | 'category' | 'quantity' | 'unit'>) => {
      await itemsService.createShoppingItem(db, listId, template.title, {
        category: template.category,
        quantity: template.quantity,
        unit: template.unit,
      });
      await loadData();
    },
    [db, listId, loadData]
  );

  const handleApplyShoppingTemplateToComposer = useCallback((template: ShoppingTemplate) => {
    setNewTaskTitle(template.title);
    setComposerCategory(template.category ?? '');
    setComposerQuantity(template.quantity ?? '');
    setComposerUnit(template.unit ?? '');
    setShowShoppingDetails(Boolean(template.category || template.quantity || template.unit));
  }, []);

  const handleToggleFavorite = useCallback(
    async (input: Pick<ShoppingFavorite, 'title' | 'category' | 'quantity' | 'unit'>) => {
      if (isFavoriteShoppingEntry(input)) {
        await itemsService.removeShoppingFavorite(db, input);
      } else {
        await itemsService.saveShoppingFavorite(db, input);
      }

      await loadData();
    },
    [db, isFavoriteShoppingEntry, loadData]
  );

  const handleDuplicateShoppingList = useCallback(async () => {
    if (!list || list.type !== 'shopping') {
      return;
    }

    const duplicatedListId = await listsService.duplicateShoppingList(db, list.id);
    if (duplicatedListId) {
      navigateToList(duplicatedListId);
    }
  }, [db, list, navigateToList]);

  const resetComposer = useCallback(() => {
    setNewTaskTitle('');
    setComposerCategory('');
    setComposerQuantity('');
    setComposerUnit('');
    setSelectedBrowseCategory(null);
    setComposerNote('');
    setComposerDueDate('');
    setComposerRecurrenceType('none');
    setComposerRecurrenceInterval('1');
    setComposerRecurrenceUnit('weeks');
    setShowComposerDetails(false);
    setNewTaskError(null);
  }, []);

  const handleCreateRootTask = useCallback(async () => {
    const nextTitle = newTaskTitle.trim();
    if (!nextTitle) {
      setNewTaskError(isShoppingList ? 'Podaj nazwe produktu.' : 'Podaj tytul taska.');
      return;
    }

    if (!isShoppingList && composerDueDate.trim() && !isValidDateKey(composerDueDate.trim())) {
      setNewTaskError('Data zadania musi miec format YYYY-MM-DD.');
      return;
    }

    if (list?.type === 'shopping') {
      await itemsService.createShoppingItems(db, listId, nextTitle, {
        category: composerCategory,
        quantity: composerQuantity,
        unit: composerUnit,
      });
    } else {
      await itemsService.createTask(db, listId, nextTitle, null, {
        note: composerNote,
        dueDate: composerDueDate.trim() || null,
        recurrenceType: composerRecurrenceType,
        recurrenceInterval: Number.parseInt(composerRecurrenceInterval, 10) || 1,
        recurrenceUnit: composerRecurrenceUnit,
      });
    }

    resetComposer();
    await loadData();
  }, [
    composerCategory,
    composerDueDate,
    composerNote,
    composerQuantity,
    composerRecurrenceInterval,
    composerRecurrenceType,
    composerRecurrenceUnit,
    composerUnit,
    db,
    isShoppingList,
    list?.type,
    listId,
    loadData,
    newTaskTitle,
    resetComposer,
  ]);

  const handleCreateChildTask = useCallback(
    async (parentId: string) => {
      const title = draftChildren[parentId]?.trim();
      if (!title) {
        setDraftErrors((current) => ({
          ...current,
          [parentId]: 'Wpisz nazwe subtaska przed zapisem.',
        }));
        return;
      }

      await itemsService.createTask(db, listId, title, parentId);
      setDraftChildren((current) => ({
        ...current,
        [parentId]: '',
      }));
      setDraftErrors((current) => ({
        ...current,
        [parentId]: '',
      }));
      expandMany([parentId]);
      await loadData();
    },
    [db, draftChildren, expandMany, listId, loadData]
  );

  const handleToggleDone = useCallback(
    async (item: ItemTreeNode) => {
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
      await loadData();
    },
    [db, loadData, pushUndoAction]
  );

  const handleDelete = useCallback(
    async (item: ItemTreeNode) => {
      closeAllSwipeables();
      await itemsService.remove(db, item.id);
      pushUndoAction({
        id: `delete-item-${item.id}-${Date.now()}`,
        label: `Usunieto element: ${item.title}`,
        perform: async (undoDb) => {
          await itemsService.restore(undoDb, item.id);
        },
      });
      await loadData();
    },
    [closeAllSwipeables, db, loadData, pushUndoAction]
  );

  const confirmDelete = useCallback(
    (item: ItemTreeNode) => {
      Alert.alert(
        'Usunac element?',
        item.hasChildren ? 'Usuniesz ten element razem z calym jego poddrzewem.' : 'Tej operacji nie cofniemy z poziomu UI.',
        [
          {
            text: 'Anuluj',
            style: 'cancel',
          },
          {
            text: 'Usun',
            style: 'destructive',
            onPress: () => {
              void handleDelete(item);
            },
          },
        ]
      );
    },
    [handleDelete]
  );

  const handleToggleMyDay = useCallback(
    async (item: ItemTreeNode) => {
      closeAllSwipeables();
      if (item.myDayDate) {
        await itemsService.removeFromMyDay(db, item.id);
      } else {
        await itemsService.addToMyDay(db, item.id);
      }

      await loadData();
    },
    [closeAllSwipeables, db, loadData]
  );

  const handleSetMyDayDate = useCallback(
    async (item: ItemTreeNode, dateKey: string) => {
      await itemsService.addToMyDay(db, item.id, dateKey);
      await loadData();
    },
    [db, loadData]
  );

  const handleMoveItem = useCallback(
    async (item: ItemTreeNode, direction: 'up' | 'down') => {
      await itemsService.moveWithinSiblings(db, item, direction);
      await loadData();
    },
    [db, loadData]
  );

  const handleClearDoneShoppingItems = useCallback(async () => {
    const doneIds = shoppingDoneItems.map((item) => item.id);
    await itemsService.removeMany(db, doneIds);
    await loadData();
  }, [db, loadData, shoppingDoneItems]);

  const handleIndentItem = useCallback(
    async (item: ItemTreeNode) => {
      await itemsService.indentUnderPreviousSibling(db, item);
      await loadData();
    },
    [db, loadData]
  );

  const handleOutdentItem = useCallback(
    async (item: ItemTreeNode) => {
      await itemsService.outdentOneLevel(db, item);
      await loadData();
    },
    [db, loadData]
  );

  const handleSwipeAction = useCallback(
    (item: ItemTreeNode, direction: 'left' | 'right') => {
      closeAllSwipeables();

      if (direction === 'right') {
        confirmDelete(item);
        return;
      }

      if (!isShoppingList) {
        void handleToggleMyDay(item);
      }
    },
    [closeAllSwipeables, confirmDelete, handleToggleMyDay, isShoppingList]
  );

  const handleChangeNewTaskTitle = useCallback((value: string) => {
    setNewTaskTitle(value);
    if (value.trim()) {
      setNewTaskError(null);
    }
  }, []);

  const handleChangeChildDraft = useCallback((itemId: string, value: string) => {
    setDraftChildren((current) => ({
      ...current,
      [itemId]: value,
    }));
    if (value.trim()) {
      setDraftErrors((current) => ({
        ...current,
        [itemId]: '',
      }));
    }
  }, []);

  const toggleSelectedItem = useCallback((itemId: string) => {
    setSelectedItemId((current) => (current === itemId ? null : itemId));
  }, []);

  const registerSwipeable = useCallback((itemId: string, instance: Swipeable | null) => {
    swipeableRefs.current[itemId] = instance;
  }, []);

  return {
    list,
    isShoppingList,
    isLoading,
    showCompleted,
    expandedIds,
    toggleExpanded,
    expandMany,
    collapseMany,
    visibleItems,
    taskOpenItems,
    taskDoneItems,
    shoppingDoneItems,
    shoppingOpenGroups,
    shoppingDoneGroups,
    expandableIds,
    listSummary,
    shoppingSortMode,
    shoppingGroupMode,
    setShoppingSortMode,
    setShoppingGroupMode,
    selectedItemId,
    toggleSelectedItem,
    draftChildren,
    draftErrors,
    newTaskTitle,
    newTaskError,
    handleChangeNewTaskTitle,
    composerCategory,
    composerQuantity,
    composerUnit,
    composerNote,
    composerDueDate,
    composerRecurrenceType,
    composerRecurrenceInterval,
    composerRecurrenceUnit,
    setComposerCategory,
    setComposerQuantity,
    setComposerUnit,
    setComposerNote,
    setComposerDueDate,
    setComposerRecurrenceType,
    setComposerRecurrenceInterval,
    setComposerRecurrenceUnit,
    showComposerDetails,
    setShowComposerDetails,
    showShoppingDetails,
    setShowShoppingDetails,
    showShoppingFavorites,
    setShowShoppingFavorites,
    showShoppingHistory,
    setShowShoppingHistory,
    showShoppingCategories,
    setShowShoppingCategories,
    customCategoryName,
    setCustomCategoryName,
    allShoppingCategoryNames,
    shoppingSuggestions,
    shoppingFavorites,
    shoppingHistory,
    selectedBrowseCategory,
    setSelectedBrowseCategory,
    browseCategoryTemplates,
    isFavoriteShoppingEntry,
    handleAddCustomCategory,
    handleCreateFromShoppingTemplate,
    handleApplyShoppingTemplateToComposer,
    handleCreateRootTask,
    handleCreateChildTask,
    handleToggleDone,
    confirmDelete,
    handleToggleMyDay,
    handleSetMyDayDate,
    handleMoveItem,
    handleClearDoneShoppingItems,
    handleIndentItem,
    handleOutdentItem,
    handleToggleFavorite,
    handleDuplicateShoppingList,
    handleSwipeAction,
    handleChangeChildDraft,
    registerSwipeable,
  };
}
