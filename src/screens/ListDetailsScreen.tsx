import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useI18n } from '../app/providers/PreferencesProvider';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { collectExpandableIds, flattenVisibleTree } from '../features/items/tree';
import type { ItemTreeNode, RecurrenceType, RecurrenceUnit } from '../features/items/types';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import type { TodoList } from '../features/lists/types';
import { ui } from '../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../utils/date';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ListDetails'>;
type DetailsRoute = RouteProp<RootStackParamList, 'ListDetails'>;
type TaskEditorState = {
  title: string;
  quantity: string;
  unit: string;
  note: string;
  dueDate: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: string;
  recurrenceUnit: RecurrenceUnit;
};

const recurrenceOptions: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'custom'];
const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Jednorazowe',
  daily: 'Codziennie',
  weekly: 'Co tydzien',
  monthly: 'Co miesiac',
  weekdays: 'Dni robocze',
  custom: 'Niestandardowo',
};

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

function buildEditorState(item?: ItemTreeNode | null): TaskEditorState {
  const parsed = parseRecurrenceConfig(item?.recurrenceConfig ?? null);

  return {
    title: item?.title ?? '',
    quantity: item?.quantity ?? '',
    unit: item?.unit ?? '',
    note: item?.note ?? '',
    dueDate: item?.dueDate ?? '',
    recurrenceType: item?.recurrenceType ?? 'none',
    recurrenceInterval: parsed.interval,
    recurrenceUnit: parsed.unit,
  };
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

export function ListDetailsScreen() {
  const db = useAppDatabase();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<DetailsRoute>();
  const { expandedIds, toggleExpanded, expandMany, collapseMany } = useTreeUiStore();
  const t = useI18n();

  const [list, setList] = useState<TodoList | null>(null);
  const [tree, setTree] = useState<ItemTreeNode[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [composerQuantity, setComposerQuantity] = useState('');
  const [composerUnit, setComposerUnit] = useState('');
  const [composerNote, setComposerNote] = useState('');
  const [composerDueDate, setComposerDueDate] = useState('');
  const [composerRecurrenceType, setComposerRecurrenceType] = useState<RecurrenceType>('none');
  const [composerRecurrenceInterval, setComposerRecurrenceInterval] = useState('1');
  const [composerRecurrenceUnit, setComposerRecurrenceUnit] = useState<RecurrenceUnit>('weeks');
  const [showComposerDetails, setShowComposerDetails] = useState(false);
  const [draftChildren, setDraftChildren] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextList, nextTree] = await Promise.all([
      listsService.getById(db, listId),
      itemsService.getListTree(db, listId),
    ]);

    setList(nextList ?? null);
    setTree(nextTree);
    setIsLoading(false);
  }, [db, listId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      setSelectedItemId(null);
      setTree([]);
      void loadData();

      return () => {
        setSelectedItemId(null);
        setTree([]);
      };
    }, [loadData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name ?? 'Lista',
    });
  }, [list?.name, navigation]);

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
    setComposerQuantity('');
    setComposerUnit('');
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
      await loadData();
    },
    [db, loadData]
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      await itemsService.remove(db, itemId);
      await loadData();
    },
    [db, loadData]
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
              void handleDelete(item.id);
            },
          },
        ]
      );
    },
    [handleDelete]
  );

  const handleToggleMyDay = useCallback(
    async (item: ItemTreeNode) => {
      if (item.myDayDate) {
        await itemsService.removeFromMyDay(db, item.id);
      } else {
        await itemsService.addToMyDay(db, item.id);
      }

      await loadData();
    },
    [db, loadData]
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

  const renderItemCard = useCallback(
    (item: ItemTreeNode) => {
      const isSelected = selectedItemId === item.id;
      const canShowChildren = !isShoppingList;
      const todayDateKey = todayKey();
      const tomorrowDateKey = dateKeyWithOffset(1);
      const isInMyDay = item.myDayDate === todayDateKey;

      return (
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
                        item.quantity || item.unit
                          ? ` • ${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`
                          : ''
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
      handleToggleDone,
      handleToggleMyDay,
      isShoppingList,
      navigation,
      selectedItemId,
      toggleExpanded,
    ]
  );

  return (
    <ScreenContainer>
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
        {isShoppingList ? (
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

      {isShoppingList && shoppingDoneItems.length > 0 ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton
            label="Wyczysc kupione"
            tone="danger"
            onPress={() => void handleClearDoneShoppingItems()}
          />
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

        {(isShoppingList ? shoppingOpenItems : taskOpenItems).map(renderItemCard)}

        {!isShoppingList && taskDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Ukonczone</Text>
            {taskDoneItems.map(renderItemCard)}
          </View>
        ) : null}

        {isShoppingList && shoppingDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Kupione</Text>
            {shoppingDoneItems.map(renderItemCard)}
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
  treeWrap: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
