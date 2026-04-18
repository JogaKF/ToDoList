import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';

import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useRecovery } from '../app/providers/RecoveryProvider';
import { useI18n, usePreferences } from '../app/providers/PreferencesProvider';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { collectExpandableIds, flattenVisibleTree } from '../features/items/tree';
import type {
  ItemTreeNode,
  RecurrenceType,
  RecurrenceUnit,
  ShoppingCategory,
  ShoppingFavorite,
  ShoppingHistoryEntry,
} from '../features/items/types';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import type { TodoList } from '../features/lists/types';
import { ui } from '../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../utils/date';

import type { ListsStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<ListsStackParamList, 'ListDetails'>;
type DetailsRoute = RouteProp<ListsStackParamList, 'ListDetails'>;
type ShoppingSortMode = 'manual' | 'alpha';
type ShoppingGroupMode = 'flat' | 'unit' | 'category';
type ShoppingGroup = {
  key: string;
  label: string | null;
  items: ItemTreeNode[];
};
type ShoppingTemplate = Pick<ShoppingHistoryEntry, 'title' | 'category' | 'quantity' | 'unit'>;

const recurrenceOptions: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'custom'];
const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Jednorazowe',
  daily: 'Codziennie',
  weekly: 'Co tydzien',
  monthly: 'Co miesiac',
  weekdays: 'Dni robocze',
  custom: 'Niestandardowo',
};
const shoppingQuickUnits = ['szt', 'kg', 'g', 'l', 'ml', 'opak'] as const;
const defaultShoppingCategories = [
  'Warzywa',
  'Owoce',
  'Nabial',
  'Pieczywo',
  'Mieso',
  'Napoje',
  'Chemia',
] as const;

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseRecurrenceConfig(raw: string | null) {
  if (!raw) {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }

  try {
    const parsed = JSON.parse(raw) as { interval?: number; unit?: RecurrenceUnit };
    return {
      interval: String(parsed.interval ?? 1),
      unit: parsed.unit ?? 'weeks',
    };
  } catch {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }
}

function getRecurrenceSummary(item: ItemTreeNode) {
  switch (item.recurrenceType) {
    case 'daily':
      return 'Powtarza sie codziennie';
    case 'weekly':
      return 'Powtarza sie co tydzien';
    case 'monthly':
      return 'Powtarza sie co miesiac';
    case 'weekdays':
      return 'Powtarza sie w dni robocze';
    case 'custom': {
      const parsed = parseRecurrenceConfig(item.recurrenceConfig);
      const unitLabel =
        parsed.unit === 'days' ? 'dni' : parsed.unit === 'weeks' ? 'tygodnie' : 'miesiace';
      return `Powtarza sie co ${parsed.interval} ${unitLabel}`;
    }
    default:
      return null;
  }
}

function formatShoppingAmount(item: Pick<ItemTreeNode, 'quantity' | 'unit'>) {
  if (!item.quantity && !item.unit) {
    return null;
  }

  return `${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`.trim();
}

function formatShoppingSecondaryMeta(item: ItemTreeNode) {
  const parts = [];

  if (item.category?.trim()) {
    parts.push(item.category.trim());
  }

  const amount = formatShoppingAmount(item);
  if (amount) {
    parts.push(amount);
  }

  return parts.length > 0 ? parts.join(' • ') : null;
}

function sortShoppingItems(items: ItemTreeNode[], mode: ShoppingSortMode) {
  if (mode === 'manual') {
    return items;
  }

  return [...items].sort((left, right) => left.title.localeCompare(right.title, 'pl', { sensitivity: 'base' }));
}

function groupShoppingItems(items: ItemTreeNode[], mode: ShoppingGroupMode) {
  if (mode === 'flat') {
    return [{ key: 'all', label: null, items }];
  }

  const groups = new Map<string, ShoppingGroup>();

  for (const item of items) {
    const rawValue =
      mode === 'category'
        ? item.category?.trim()
        : item.unit?.trim();
    const normalizedValue = rawValue?.toLowerCase() || (mode === 'category' ? 'bez-kategorii' : 'bez-jednostki');
    const label = rawValue || (mode === 'category' ? 'Bez kategorii' : 'Bez jednostki');
    const current = groups.get(normalizedValue) ?? {
      key: normalizedValue,
      label,
      items: [],
    };
    current.items.push(item);
    groups.set(normalizedValue, current);
  }

  return [...groups.values()].sort((left, right) => {
    const emptyKey = mode === 'category' ? 'bez-kategorii' : 'bez-jednostki';
    if (left.key === emptyKey) {
      return 1;
    }
    if (right.key === emptyKey) {
      return -1;
    }
    return left.label!.localeCompare(right.label!, 'pl', { sensitivity: 'base' });
  });
}

function buildTemplateKey(template: ShoppingTemplate) {
  return [
    template.title.trim().toLowerCase(),
    template.category?.trim().toLowerCase() ?? '',
    template.quantity?.trim() ?? '',
    template.unit?.trim() ?? '',
  ].join('|');
}

export function ListDetailsScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<DetailsRoute>();
  const { expandedIds, toggleExpanded, expandMany, collapseMany } = useTreeUiStore();
  const { pushUndoAction, mutationTick } = useRecovery();
  const t = useI18n();
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

  const listId = route.params.listId;
  const isShoppingList = list?.type === 'shopping';

  const visibleItems = useMemo(() => flattenVisibleTree(tree, expandedIds), [expandedIds, tree]);
  const taskOpenItems = useMemo(
    () => visibleItems.filter((item) => item.status === 'todo'),
    [visibleItems]
  );
  const taskDoneItems = useMemo(
    () => visibleItems.filter((item) => item.status === 'done'),
    [visibleItems]
  );
  const shoppingOpenItems = useMemo(
    () => visibleItems.filter((item) => item.status === 'todo'),
    [visibleItems]
  );
  const shoppingDoneItems = useMemo(
    () => visibleItems.filter((item) => item.status === 'done'),
    [visibleItems]
  );
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

    return shoppingTemplates
      .filter((template) => template.title.toLowerCase().includes(query))
      .slice(0, 6);
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name ?? 'Lista',
    });
  }, [list?.name, navigation]);

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
      navigation.navigate('ListDetails', { listId: duplicatedListId });
    }
  }, [db, list, navigation]);

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
    await loadData();
  }, [
    composerQuantity,
    composerUnit,
    composerDueDate,
    composerCategory,
    composerNote,
    composerRecurrenceInterval,
    composerRecurrenceType,
    composerRecurrenceUnit,
    db,
    isShoppingList,
    list?.type,
    listId,
    loadData,
    newTaskTitle,
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
        item.hasChildren
          ? 'Usuniesz ten element razem z calym jego poddrzewem.'
          : 'Tej operacji nie cofniemy z poziomu UI.',
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

  const renderSwipeSide = useCallback(
    (direction: 'left' | 'right', item: ItemTreeNode) => {
      const isDelete = direction === 'right';

      if (!isDelete && isShoppingList) {
        return <View style={styles.swipeSpacer} />;
      }

      const label = isDelete
        ? 'Usun'
        : item.myDayDate
          ? 'Usun z dnia'
          : 'Dodaj do dnia';
      const containerStyle = isDelete ? styles.swipeDeleteAction : styles.swipeMyDayAction;
      const labelStyle = isDelete ? styles.swipeDeleteText : styles.swipeMyDayText;

      return (
        <View style={[styles.swipeAction, containerStyle]}>
          <Text style={labelStyle}>{label}</Text>
        </View>
      );
    },
    [isShoppingList]
  );

  const renderItemCard = useCallback(
    (item: ItemTreeNode) => {
      const isSelected = selectedItemId === item.id;
      const canShowChildren = !isShoppingList;
      const todayDateKey = todayKey();
      const tomorrowDateKey = dateKeyWithOffset(1);
      const isInMyDay = item.myDayDate === todayDateKey;
      const isFavoriteShoppingItem = isShoppingList
        ? isFavoriteShoppingEntry({
            title: item.title,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
          })
        : false;

      const card = (
        <Pressable
          key={item.id}
          onPress={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}
          style={[
            styles.itemCard,
            isSelected && styles.itemCardSelected,
            {
              marginLeft: canShowChildren ? item.depth * 12 : 0,
              borderLeftWidth: canShowChildren && item.depth > 0 ? 2 : 0,
              borderLeftColor: canShowChildren && item.depth > 0 ? '#1D4D69' : 'transparent',
            },
          ]}
        >
          <View style={styles.itemTopRow}>
            {canShowChildren && item.hasChildren ? (
              <Pressable onPress={() => toggleExpanded(item.id)} style={styles.treeToggle}>
                <Text style={styles.treeToggleText}>{expandedIds[item.id] ? '⌄' : '›'}</Text>
              </Pressable>
            ) : (
              <View style={styles.treeSpacer} />
            )}

            <Pressable
              onPress={() => void handleToggleDone(item)}
              style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}
            >
              <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
            </Pressable>

            <View style={styles.itemContent}>
              <>
                <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {isShoppingList
                    ? `${item.status === 'done' ? 'Kupione' : 'Do kupienia'}${
                        formatShoppingSecondaryMeta(item) ? ` • ${formatShoppingSecondaryMeta(item)}` : ''
                      }`
                    : isInMyDay
                      ? `Moj dzien: ${item.myDayDate}`
                      : 'Poza Moim dniem'}
                </Text>
                {item.dueDate ? (
                  <Text style={styles.itemMeta}>
                    Termin: {isValidDateKey(item.dueDate) ? formatDateLabel(item.dueDate) : item.dueDate}
                  </Text>
                ) : null}
                {getRecurrenceSummary(item) ? (
                  <Text style={styles.itemMeta}>{getRecurrenceSummary(item)}</Text>
                ) : null}
                {item.note ? (
                  <Text style={styles.itemNote} numberOfLines={2}>
                    {item.note}
                  </Text>
                ) : null}
                {!isShoppingList && item.parentId ? (
                  <Text style={styles.itemHint}>Subtask</Text>
                ) : null}
              </>
            </View>

            {isShoppingList && formatShoppingAmount(item) ? (
              <View style={styles.shoppingAmountBadge}>
                <Text style={styles.shoppingAmountText}>{formatShoppingAmount(item)}</Text>
              </View>
            ) : null}
          </View>

          {isSelected ? (
            <View style={styles.actionsRow}>
              <View style={styles.iconCluster}>
                <IconButton
                  icon="arrow-up"
                  onPress={() => void handleMoveItem(item, 'up')}
                />
                <IconButton
                  icon="arrow-down"
                  onPress={() => void handleMoveItem(item, 'down')}
                />
                {!isShoppingList ? (
                  <>
                    <IconButton
                      icon="indent"
                      onPress={() => void handleIndentItem(item)}
                    />
                    <IconButton
                      icon="outdent"
                      onPress={() => void handleOutdentItem(item)}
                      disabled={!item.parentId}
                    />
                  </>
                ) : null}
                {!isShoppingList ? (
                  <IconButton
                    icon={isInMyDay ? 'weather-sunset-down' : 'weather-sunny'}
                    onPress={() => void handleToggleMyDay(item)}
                    active={isInMyDay}
                  />
                ) : null}
                {isShoppingList ? (
                  <IconButton
                    icon="star"
                    onPress={() =>
                      void handleToggleFavorite({
                        title: item.title,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                      })
                    }
                    active={isFavoriteShoppingItem}
                    tone={isFavoriteShoppingItem ? 'primary' : 'muted'}
                  />
                ) : null}
                <IconButton
                  icon="magnify"
                  onPress={() => navigation.navigate('TaskPreview', { itemId: item.id })}
                />
                <IconButton
                  icon="pencil-outline"
                  onPress={() => navigation.navigate('TaskPreview', { itemId: item.id })}
                />
                <IconButton
                  icon="trash-can-outline"
                  tone="danger"
                  onPress={() => confirmDelete(item)}
                />
              </View>
              {!isShoppingList ? (
                <View style={styles.scheduleRow}>
                  <PrimaryButton
                    label={`Dzis ${formatDateLabel(todayDateKey)}`}
                    tone={item.myDayDate === todayDateKey ? 'primary' : 'muted'}
                    onPress={() => void handleSetMyDayDate(item, todayDateKey)}
                  />
                  <PrimaryButton
                    label={`Jutro ${formatDateLabel(tomorrowDateKey)}`}
                    tone={item.myDayDate === tomorrowDateKey ? 'primary' : 'muted'}
                    onPress={() => void handleSetMyDayDate(item, tomorrowDateKey)}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {canShowChildren ? (
            <View style={styles.childComposer}>
              {isSelected || (draftChildren[item.id] ?? '').length > 0 ? (
                <>
                  <TextInput
                    value={draftChildren[item.id] ?? ''}
                    onChangeText={(value) => {
                      setDraftChildren((current) => ({
                        ...current,
                        [item.id]: value,
                      }));
                      if (value.trim()) {
                        setDraftErrors((current) => ({
                          ...current,
                          [item.id]: '',
                        }));
                      }
                    }}
                    placeholder={item.parentId ? 'Dodaj kolejny poziom' : 'Dodaj subtask'}
                    placeholderTextColor={ui.colors.textSoft}
                    style={styles.input}
                    maxLength={120}
                    returnKeyType="done"
                    onSubmitEditing={() => void handleCreateChildTask(item.id)}
                  />
                  <Text style={styles.inputHintInline}>
                    {draftErrors[item.id] ||
                      (item.parentId
                        ? 'Nowy poziom zapisze sie lokalnie pod tym elementem.'
                        : 'Subtask pojawi sie od razu pod wybranym taskiem.')}
                  </Text>
                  <View style={styles.subtaskActionsRow}>
                    <PrimaryButton
                      label={item.parentId ? 'Dodaj nizej' : 'Dodaj subtask'}
                      leadingIcon="+"
                      onPress={() => void handleCreateChildTask(item.id)}
                    />
                    {item.hasChildren ? (
                      <IconButton
                        icon={expandedIds[item.id] ? 'unfold-less-horizontal' : 'unfold-more-horizontal'}
                        onPress={() => toggleExpanded(item.id)}
                      />
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      );

      const canSwipeRight = !isShoppingList;

      return (
        <Swipeable
          key={item.id}
          ref={(instance) => {
            swipeableRefs.current[item.id] = instance;
          }}
          overshootLeft={false}
          overshootRight={false}
          leftThreshold={72}
          rightThreshold={72}
          friction={2}
          renderLeftActions={canSwipeRight ? () => renderSwipeSide('left', item) : undefined}
          renderRightActions={() => renderSwipeSide('right', item)}
          onSwipeableOpen={(direction) => handleSwipeAction(item, direction)}
        >
          {card}
        </Swipeable>
      );
    },
    [
      collapseMany,
      db,
      draftChildren,
      draftErrors,
      expandedIds,
      handleCreateChildTask,
      handleIndentItem,
      handleMoveItem,
      handleOutdentItem,
      handleSetMyDayDate,
      handleSwipeAction,
      handleToggleFavorite,
      handleToggleDone,
      handleToggleMyDay,
      isFavoriteShoppingEntry,
      isShoppingList,
      navigation,
      renderSwipeSide,
      selectedItemId,
      toggleExpanded,
    ]
  );

  const renderShoppingGroups = useCallback(
    (groups: ShoppingGroup[]) =>
      groups.map((group) => (
        <View key={group.key} style={group.label ? styles.shoppingGroupSection : undefined}>
          {group.label ? <Text style={styles.shoppingGroupTitle}>{group.label}</Text> : null}
          <View style={styles.shoppingGroupItems}>{group.items.map(renderItemCard)}</View>
        </View>
      )),
    [renderItemCard]
  );

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{list?.name ?? 'Lista'}</Text>
        <Text style={styles.headerMeta}>
          {isShoppingList ? 'Tryb zakupow' : 'Tryb taskow'}
        </Text>
        <Text style={styles.headerSubmeta}>
          {isShoppingList
            ? `${listSummary.openItems} do kupienia, ${listSummary.doneItems} kupionych`
            : `${listSummary.totalItems} aktywnych pozycji w drzewie`}
        </Text>
      </View>

      <View style={styles.composerCard}>
        <Text style={styles.sectionTitle}>
          {isShoppingList ? t('details_new_item') : t('details_new_task')}
        </Text>
        <TextInput
          value={newTaskTitle}
          onChangeText={(value) => {
            setNewTaskTitle(value);
            if (value.trim()) {
              setNewTaskError(null);
            }
          }}
          placeholder={isShoppingList ? 'Np. Chleb, mleko, jajka' : 'Dodaj glowny task'}
          placeholderTextColor={ui.colors.textSoft}
          style={styles.input}
          maxLength={120}
          returnKeyType="done"
          onSubmitEditing={() => void handleCreateRootTask()}
        />
        <Text style={styles.inputHint}>
          {newTaskError ??
            (isShoppingList
              ? 'Wpisz wiele produktow naraz, oddzielajac je przecinkiem albo nowa linia.'
              : 'Tworz glowny task i potem rozwijaj go subtaskami.')}
        </Text>
        {isShoppingList && shoppingSuggestions.length > 0 ? (
          <View style={styles.shoppingSupportSection}>
            <Text style={styles.supportTitle}>Podpowiedzi</Text>
            <View style={styles.supportGrid}>
              {shoppingSuggestions.map((template, index) => (
                <Pressable
                  key={`${buildTemplateKey(template)}-${index}`}
                  onPress={() => handleApplyShoppingTemplateToComposer(template)}
                  style={styles.supportCard}
                >
                  <Text style={styles.supportCardTitle}>{template.title}</Text>
                  <Text style={styles.supportCardMeta}>
                    {[template.category, template.quantity, template.unit].filter(Boolean).join(' • ') || 'Dopelnij i dodaj'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {isShoppingList ? (
          <View style={styles.toolbarRow}>
            <PrimaryButton
              label={showShoppingDetails ? 'Ukryj szczegoly' : 'Szczegoly produktu'}
              tone="muted"
              onPress={() => setShowShoppingDetails((current) => !current)}
            />
            <PrimaryButton
              label={showShoppingFavorites ? 'Ukryj ulubione' : 'Ulubione'}
              tone="muted"
              onPress={() => setShowShoppingFavorites((current) => !current)}
            />
            <PrimaryButton
              label={showShoppingHistory ? 'Ukryj historie' : 'Historia'}
              tone="muted"
              onPress={() => setShowShoppingHistory((current) => !current)}
            />
            <PrimaryButton
              label={showShoppingCategories ? 'Ukryj kategorie' : 'Kategorie'}
              tone="muted"
              onPress={() => setShowShoppingCategories((current) => !current)}
            />
          </View>
        ) : null}
        {isShoppingList && showShoppingDetails ? (
          <View style={styles.detailsEditor}>
            <View style={styles.scheduleRow}>
              <TextInput
                value={composerQuantity}
                onChangeText={setComposerQuantity}
                style={[styles.input, styles.shoppingMetaInput]}
                placeholder="Ilosc"
                placeholderTextColor={ui.colors.textSoft}
              />
              <TextInput
                value={composerUnit}
                onChangeText={setComposerUnit}
                style={[styles.input, styles.shoppingMetaInput]}
                placeholder="Jednostka"
                placeholderTextColor={ui.colors.textSoft}
              />
            </View>
            <View style={styles.scheduleRow}>
              {shoppingQuickUnits.map((unit) => (
                <PrimaryButton
                  key={`composer-unit-${unit}`}
                  label={unit}
                  tone={composerUnit === unit ? 'primary' : 'muted'}
                  onPress={() => setComposerUnit((current) => (current === unit ? '' : unit))}
                />
              ))}
            </View>
            <View style={styles.scheduleRow}>
              {allShoppingCategoryNames.map((category) => (
                <PrimaryButton
                  key={`composer-category-${category}`}
                  label={category}
                  tone={composerCategory === category ? 'primary' : 'muted'}
                  onPress={() => setComposerCategory((current) => (current === category ? '' : category))}
                />
              ))}
            </View>
          </View>
        ) : null}
        {isShoppingList && showShoppingCategories ? (
          <View style={styles.shoppingSupportSection}>
            <Text style={styles.supportTitle}>Kategorie i katalog</Text>
            <View style={styles.scheduleRow}>
              {allShoppingCategoryNames.map((category) => (
                <PrimaryButton
                  key={`browse-${category}`}
                  label={category}
                  tone={selectedBrowseCategory === category ? 'primary' : 'muted'}
                  onPress={() => setSelectedBrowseCategory((current) => (current === category ? null : category))}
                />
              ))}
            </View>
            <View style={styles.scheduleRow}>
              <TextInput
                value={customCategoryName}
                onChangeText={setCustomCategoryName}
                style={[styles.input, styles.shoppingMetaInput]}
                placeholder="Nowa kategoria"
                placeholderTextColor={ui.colors.textSoft}
              />
              <PrimaryButton
                label="Dodaj kategorie"
                tone="muted"
                onPress={() => void handleAddCustomCategory()}
                disabled={!customCategoryName.trim()}
              />
            </View>
            {selectedBrowseCategory ? (
              <View style={styles.supportGrid}>
                {browseCategoryTemplates.length > 0 ? (
                  browseCategoryTemplates.map((template, index) => (
                    <Pressable
                      key={`${buildTemplateKey(template)}-browse-${index}`}
                      onPress={() => void handleCreateFromShoppingTemplate(template)}
                      style={styles.supportCard}
                    >
                      <Text style={styles.supportCardTitle}>{template.title}</Text>
                      <Text style={styles.supportCardMeta}>
                        {[template.quantity, template.unit].filter(Boolean).join(' ') || selectedBrowseCategory}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.inputHintInline}>Brak zapisanych produktow w tej kategorii.</Text>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
        <PrimaryButton
          label={isShoppingList ? t('details_add_product') : t('details_add_task')}
          leadingIcon="+"
          disabled={!newTaskTitle.trim()}
          onPress={() => void handleCreateRootTask()}
        />
        {!isShoppingList ? (
          <>
            <PrimaryButton
              label={showComposerDetails ? 'Ukryj szczegoly zadania' : 'Dodaj note i termin'}
              tone="muted"
              onPress={() => setShowComposerDetails((current) => !current)}
            />
            {showComposerDetails ? (
              <View style={styles.detailsEditor}>
                <TextInput
                  value={composerNote}
                  onChangeText={setComposerNote}
                  style={[styles.input, styles.noteInput]}
                  placeholder="Notatka do zadania"
                  placeholderTextColor={ui.colors.textSoft}
                  multiline
                  textAlignVertical="top"
                />
                <TextInput
                  value={composerDueDate}
                  onChangeText={setComposerDueDate}
                  style={styles.input}
                  placeholder="Termin YYYY-MM-DD"
                  placeholderTextColor={ui.colors.textSoft}
                  autoCapitalize="none"
                />
                <View style={styles.scheduleRow}>
                  <PrimaryButton
                    label="Dzisiaj"
                    tone={composerDueDate === todayKey() ? 'primary' : 'muted'}
                    onPress={() => setComposerDueDate(todayKey())}
                  />
                  <PrimaryButton
                    label="Jutro"
                    tone={composerDueDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                    onPress={() => setComposerDueDate(dateKeyWithOffset(1))}
                  />
                  <PrimaryButton
                    label="Bez daty"
                    tone={!composerDueDate ? 'primary' : 'muted'}
                    onPress={() => setComposerDueDate('')}
                  />
                </View>
                <View style={styles.scheduleRow}>
                  {recurrenceOptions.map((option) => (
                    <PrimaryButton
                      key={`composer-${option}`}
                      label={recurrenceLabels[option]}
                      tone={composerRecurrenceType === option ? 'primary' : 'muted'}
                      onPress={() => setComposerRecurrenceType(option)}
                    />
                  ))}
                </View>
                {composerRecurrenceType === 'custom' ? (
                  <View style={styles.scheduleRow}>
                    <TextInput
                      value={composerRecurrenceInterval}
                      onChangeText={(value) =>
                        setComposerRecurrenceInterval(value.replace(/[^0-9]/g, ''))
                      }
                      style={[styles.input, styles.intervalInput]}
                      placeholder="Interwal"
                      placeholderTextColor={ui.colors.textSoft}
                      keyboardType="number-pad"
                    />
                    {(['days', 'weeks', 'months'] as RecurrenceUnit[]).map((unit) => (
                      <PrimaryButton
                        key={`composer-${unit}`}
                        label={unit === 'days' ? 'Dni' : unit === 'weeks' ? 'Tygodnie' : 'Miesiace'}
                        tone={composerRecurrenceUnit === unit ? 'primary' : 'muted'}
                        onPress={() => setComposerRecurrenceUnit(unit)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {isShoppingList && showShoppingFavorites && shoppingFavorites.length > 0 ? (
          <View style={styles.shoppingSupportSection}>
            <Text style={styles.supportTitle}>Ulubione produkty</Text>
            <View style={styles.supportGrid}>
              {shoppingFavorites.slice(0, 8).map((favorite) => (
                <Pressable
                  key={favorite.id}
                  onPress={() => handleApplyShoppingTemplateToComposer(favorite)}
                  style={styles.supportCard}
                >
                  <Text style={styles.supportCardTitle}>{favorite.title}</Text>
                  <Text style={styles.supportCardMeta}>
                    {[favorite.category, favorite.quantity, favorite.unit].filter(Boolean).join(' • ') || 'Szybkie dodanie'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {isShoppingList && showShoppingHistory && shoppingHistory.length > 0 ? (
          <View style={styles.shoppingSupportSection}>
            <Text style={styles.supportTitle}>Dodaj z historii</Text>
            <View style={styles.supportGrid}>
              {shoppingHistory.slice(0, 10).map((entry, index) => (
                <Pressable
                  key={`${entry.title}-${entry.category ?? 'none'}-${index}`}
                  onPress={() => handleApplyShoppingTemplateToComposer(entry)}
                  style={styles.supportCard}
                >
                  <Text style={styles.supportCardTitle}>{entry.title}</Text>
                  <Text style={styles.supportCardMeta}>
                    {[entry.category, entry.quantity, entry.unit].filter(Boolean).join(' • ') || 'Historia'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {!isShoppingList && expandableIds.length > 0 ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton
            label={t('details_expand_all')}
            onPress={() => expandMany(expandableIds)}
            tone="muted"
          />
          <PrimaryButton
            label={t('details_collapse_all')}
            onPress={() => collapseMany(expandableIds)}
            tone="muted"
          />
        </View>
      ) : null}

      {isShoppingList ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton
            label="Kolejnosc reczna"
            tone={shoppingSortMode === 'manual' ? 'primary' : 'muted'}
            onPress={() => setShoppingSortMode('manual')}
          />
          <PrimaryButton
            label="A-Z"
            tone={shoppingSortMode === 'alpha' ? 'primary' : 'muted'}
            onPress={() => setShoppingSortMode('alpha')}
          />
          <PrimaryButton
            label="Bez grup"
            tone={shoppingGroupMode === 'flat' ? 'primary' : 'muted'}
            onPress={() => setShoppingGroupMode('flat')}
          />
          <PrimaryButton
            label="Grupuj kategorie"
            tone={shoppingGroupMode === 'category' ? 'primary' : 'muted'}
            onPress={() => setShoppingGroupMode('category')}
          />
          <PrimaryButton
            label="Grupuj jednostki"
            tone={shoppingGroupMode === 'unit' ? 'primary' : 'muted'}
            onPress={() => setShoppingGroupMode('unit')}
          />
          <PrimaryButton
            label="Kopiuj liste"
            tone="muted"
            onPress={() => void handleDuplicateShoppingList()}
          />
          {shoppingDoneItems.length > 0 ? (
          <PrimaryButton
            label="Wyczysc kupione"
            tone="danger"
            onPress={() => void handleClearDoneShoppingItems()}
          />
          ) : null}
        </View>
      ) : null}

      <View style={styles.treeWrap}>
        {isLoading ? (
          <StateCard
            title={t('details_loading')}
            description={t('details_loading_hint')}
          />
        ) : null}

        {!isLoading && visibleItems.length === 0 ? (
          <StateCard
            title={isShoppingList ? t('details_empty_shopping') : t('details_empty_tasks')}
            description={
              isShoppingList
                ? t('details_empty_shopping_hint')
                : t('details_empty_tasks_hint')
            }
          />
        ) : null}

        {isShoppingList ? renderShoppingGroups(shoppingOpenGroups) : taskOpenItems.map(renderItemCard)}

        {!isShoppingList && showCompleted && taskDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Ukonczone</Text>
            {taskDoneItems.map(renderItemCard)}
          </View>
        ) : null}

        {isShoppingList && showCompleted && shoppingDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Kupione</Text>
            {renderShoppingGroups(shoppingDoneGroups)}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#102741',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2C6D96',
  },
  headerTitle: {
    color: ui.colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  headerMeta: {
    color: ui.colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  headerSubmeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  composerCard: {
    backgroundColor: '#102238',
    borderRadius: ui.radius.md,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1B405F',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.input,
    color: ui.colors.text,
  },
  noteInput: {
    minHeight: 94,
    paddingTop: 14,
  },
  shoppingMetaInput: {
    minWidth: 120,
    flex: 1,
  },
  intervalInput: {
    minWidth: 100,
    flexGrow: 0,
  },
  inputHint: {
    color: ui.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
  },
  inputHintInline: {
    color: ui.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  shoppingSupportSection: {
    gap: 8,
  },
  supportTitle: {
    color: ui.colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  supportGrid: {
    gap: 8,
  },
  supportCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
    gap: 4,
  },
  supportCardTitle: {
    color: ui.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  supportCardMeta: {
    color: ui.colors.textMuted,
    fontSize: 12,
  },
  treeWrap: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shoppingGroupSection: {
    gap: 10,
  },
  shoppingGroupItems: {
    gap: 12,
  },
  shoppingGroupTitle: {
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  itemCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  itemCardSelected: {
    backgroundColor: '#132D45',
    borderColor: '#2F7AA2',
  },
  itemCardDone: {
    opacity: 0.9,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  shoppingAmountBadge: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#143048',
    borderWidth: 1,
    borderColor: 'rgba(47, 122, 162, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingAmountText: {
    color: ui.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  treeToggle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeToggleText: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.primary,
  },
  treeSpacer: {
    width: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxDone: {
    backgroundColor: ui.colors.primaryStrong,
  },
  checkboxLabel: {
    color: '#041018',
    fontWeight: '800',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.colors.text,
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: ui.colors.textSoft,
  },
  itemMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  itemNote: {
    color: ui.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  itemHint: {
    color: ui.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionsRow: {
    gap: 8,
    paddingTop: 2,
  },
  childComposer: {
    gap: 8,
    paddingTop: 2,
  },
  detailsEditor: {
    gap: 8,
    paddingTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtaskActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  iconCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  doneSection: {
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(25, 56, 82, 0.32)',
  },
  doneSectionTitle: {
    color: ui.colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swipeAction: {
    minWidth: 120,
    marginVertical: 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  swipeMyDayAction: {
    backgroundColor: '#143D4A',
    borderWidth: 1,
    borderColor: 'rgba(74, 196, 255, 0.32)',
  },
  swipeDeleteAction: {
    backgroundColor: '#471A27',
    borderWidth: 1,
    borderColor: 'rgba(255, 114, 145, 0.34)',
  },
  swipeMyDayText: {
    color: '#8BE4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeDeleteText: {
    color: '#FFB8C8',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeSpacer: {
    width: 12,
  },
});
