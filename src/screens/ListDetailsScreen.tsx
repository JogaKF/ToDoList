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
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { collectExpandableIds, flattenVisibleTree } from '../features/items/tree';
import type { ItemTreeNode } from '../features/items/types';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import type { TodoList } from '../features/lists/types';
import { ui } from '../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../utils/date';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ListDetails'>;
type DetailsRoute = RouteProp<RootStackParamList, 'ListDetails'>;

export function ListDetailsScreen() {
  const db = useAppDatabase();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<DetailsRoute>();
  const { expandedIds, toggleExpanded, expandMany, collapseMany } = useTreeUiStore();

  const [list, setList] = useState<TodoList | null>(null);
  const [tree, setTree] = useState<ItemTreeNode[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draftChildren, setDraftChildren] = useState<Record<string, string>>({});
  const [draftSiblings, setDraftSiblings] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [siblingErrors, setSiblingErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const listId = route.params.listId;
  const isShoppingList = list?.type === 'shopping';

  const visibleItems = useMemo(() => flattenVisibleTree(tree, expandedIds), [expandedIds, tree]);
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

    if (list?.type === 'shopping') {
      await itemsService.createShoppingItems(db, listId, nextTitle);
    } else {
      await itemsService.createTask(db, listId, nextTitle);
    }
    setNewTaskTitle('');
    setNewTaskError(null);
    await loadData();
  }, [db, isShoppingList, list?.type, listId, loadData, newTaskTitle]);

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

  const handleCreateSiblingTask = useCallback(
    async (item: ItemTreeNode) => {
      const title = draftSiblings[item.id]?.trim();
      if (!title) {
        setSiblingErrors((current) => ({
          ...current,
          [item.id]: 'Wpisz nazwe elementu obok przed zapisem.',
        }));
        return;
      }

      await itemsService.createSiblingTask(db, item, title);
      setDraftSiblings((current) => ({
        ...current,
        [item.id]: '',
      }));
      setSiblingErrors((current) => ({
        ...current,
        [item.id]: '',
      }));
      await loadData();
    },
    [db, draftSiblings, loadData]
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

  const handleRename = useCallback(
    async (itemId: string) => {
      const nextTitle = editingTitle.trim();
      if (!nextTitle) {
        setEditingError('Tytul nie moze byc pusty.');
        return;
      }

      await itemsService.rename(db, itemId, nextTitle);
      setEditingItemId(null);
      setEditingTitle('');
      setEditingError(null);
      setSelectedItemId(null);
      await loadData();
    },
    [db, editingTitle, loadData]
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
          {isShoppingList ? 'Nowa pozycja' : 'Nowy task'}
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
        <PrimaryButton
          label={isShoppingList ? 'Dodaj produkty' : 'Dodaj task'}
          leadingIcon="+"
          disabled={!newTaskTitle.trim()}
          onPress={() => void handleCreateRootTask()}
        />
      </View>

      {!isShoppingList && expandableIds.length > 0 ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton
            label="Rozwin wszystko"
            onPress={() => expandMany(expandableIds)}
            tone="muted"
          />
          <PrimaryButton
            label="Zwin wszystko"
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
            title="Laduje zawartosc listy"
            description="Buduje lokalne drzewo elementow i porzadkuje widok."
          />
        ) : null}

        {!isLoading && visibleItems.length === 0 ? (
          <StateCard
            title={isShoppingList ? 'Lista zakupow jest jeszcze pusta' : 'Ta lista jest jeszcze pusta'}
            description={
              isShoppingList
                ? 'Dodaj pierwsze produkty i odhaczaj je podczas zakupow.'
                : 'Dodaj pierwszy task i buduj drzewo przez subtaski.'
            }
          />
        ) : null}

        {(isShoppingList ? shoppingOpenItems : visibleItems).map((item) => {
          const isEditing = editingItemId === item.id;
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
                  style={[
                    styles.checkbox,
                    item.status === 'done' && styles.checkboxDone,
                  ]}
                >
                  <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
                </Pressable>

                <View style={styles.itemContent}>
                  {isEditing ? (
                    <TextInput
                      value={editingTitle}
                      onChangeText={(value) => {
                        setEditingTitle(value);
                        if (value.trim()) {
                          setEditingError(null);
                        }
                      }}
                      style={styles.input}
                      placeholder="Nowy tytul"
                      placeholderTextColor={ui.colors.textSoft}
                      autoFocus
                      maxLength={120}
                      returnKeyType="done"
                      onSubmitEditing={() => void handleRename(item.id)}
                    />
                  ) : (
                    <>
                      <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {isShoppingList
                          ? item.status === 'done'
                            ? 'Kupione'
                            : 'Do kupienia'
                          : isInMyDay
                            ? `Moj dzien: ${item.myDayDate}`
                            : 'Poza Moim dniem'}
                      </Text>
                      {!isShoppingList && item.parentId ? (
                        <Text style={styles.itemHint}>Subtask</Text>
                      ) : null}
                    </>
                  )}
                </View>
              </View>

              {isSelected || isEditing ? (
                <View style={styles.actionsRow}>
                  {isEditing ? (
                    <Text style={styles.inputHintInline}>
                      {editingError ?? 'Enter lub ikona potwierdzenia zapisze zmiane.'}
                    </Text>
                  ) : null}
                  <View style={styles.iconCluster}>
                    <IconButton
                      icon="arrow-up"
                      onPress={() => void handleMoveItem(item, 'up')}
                      disabled={isEditing}
                    />
                    <IconButton
                      icon="arrow-down"
                      onPress={() => void handleMoveItem(item, 'down')}
                      disabled={isEditing}
                    />
                    {!isShoppingList ? (
                      <>
                        <IconButton
                          icon="indent"
                          onPress={() => void handleIndentItem(item)}
                          disabled={isEditing}
                        />
                        <IconButton
                          icon="outdent"
                          onPress={() => void handleOutdentItem(item)}
                          disabled={isEditing || !item.parentId}
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
                      {!isEditing ? (
                        <IconButton
                          icon="pencil-outline"
                          onPress={() => {
                            setEditingItemId(item.id);
                            setEditingTitle(item.title);
                            setEditingError(null);
                          }}
                        />
                      ) : (
                      <>
                        <IconButton
                          icon="check"
                          tone="primary"
                          onPress={() => void handleRename(item.id)}
                        />
                          <IconButton
                            icon="close"
                            onPress={() => {
                              setEditingItemId(null);
                              setEditingTitle('');
                              setEditingError(null);
                              setSelectedItemId(null);
                            }}
                          />
                      </>
                    )}
                    <IconButton
                      icon="trash-can-outline"
                      tone="danger"
                      onPress={() => confirmDelete(item)}
                    />
                  </View>
                  {!isEditing && !isShoppingList ? (
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
                  {!isEditing &&
                  (isSelected ||
                    (draftChildren[item.id] ?? '').length > 0 ||
                    (draftSiblings[item.id] ?? '').length > 0) ? (
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
                      <TextInput
                        value={draftSiblings[item.id] ?? ''}
                        onChangeText={(value) => {
                          setDraftSiblings((current) => ({
                            ...current,
                            [item.id]: value,
                          }));
                          if (value.trim()) {
                            setSiblingErrors((current) => ({
                              ...current,
                              [item.id]: '',
                            }));
                          }
                        }}
                        placeholder="Dodaj rownolegle obok tego elementu"
                        placeholderTextColor={ui.colors.textSoft}
                        style={styles.input}
                        maxLength={120}
                        returnKeyType="done"
                        onSubmitEditing={() => void handleCreateSiblingTask(item)}
                      />
                      <Text style={styles.inputHintInline}>
                        {siblingErrors[item.id] ||
                          'Nowy element trafi obok aktualnego, na tym samym poziomie.'}
                      </Text>
                      <View style={styles.subtaskActionsRow}>
                        <PrimaryButton
                          label={item.parentId ? 'Dodaj nizej' : 'Dodaj subtask'}
                          leadingIcon="+"
                          onPress={() => void handleCreateChildTask(item.id)}
                        />
                        <PrimaryButton
                          label="Dodaj obok"
                          leadingIcon="+"
                          tone="muted"
                          onPress={() => void handleCreateSiblingTask(item)}
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
        })}

        {isShoppingList && shoppingDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Kupione</Text>
            {shoppingDoneItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const isSelected = selectedItemId === item.id;
              const isInMyDay = item.myDayDate === todayKey();

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}
                  style={[styles.itemCard, styles.itemCardDone, isSelected && styles.itemCardSelected]}
                >
                  <View style={styles.itemTopRow}>
                    <View style={styles.treeSpacer} />
                    <Pressable
                      onPress={() => void handleToggleDone(item)}
                      style={[styles.checkbox, styles.checkboxDone]}
                    >
                      <Text style={styles.checkboxLabel}>✓</Text>
                    </Pressable>
                    <View style={styles.itemContent}>
                      {isEditing ? (
                        <TextInput
                          value={editingTitle}
                          onChangeText={(value) => {
                            setEditingTitle(value);
                            if (value.trim()) {
                              setEditingError(null);
                            }
                          }}
                          style={styles.input}
                          placeholder="Nowy tytul"
                          placeholderTextColor={ui.colors.textSoft}
                          autoFocus
                          maxLength={120}
                          returnKeyType="done"
                          onSubmitEditing={() => void handleRename(item.id)}
                        />
                      ) : (
                        <>
                          <Text style={[styles.itemTitle, styles.itemDone]}>{item.title}</Text>
                          <Text style={styles.itemMeta}>Kupione</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {isSelected || isEditing ? (
                    <View style={styles.actionsRow}>
                      <View style={styles.iconCluster}>
                        {!isEditing ? (
                          <IconButton
                            icon="pencil-outline"
                            onPress={() => {
                              setEditingItemId(item.id);
                              setEditingTitle(item.title);
                              setEditingError(null);
                            }}
                          />
                        ) : (
                          <>
                            <IconButton
                              icon="check"
                              tone="primary"
                              onPress={() => void handleRename(item.id)}
                            />
                            <IconButton
                              icon="close"
                              onPress={() => {
                                setEditingItemId(null);
                                setEditingTitle('');
                                setEditingError(null);
                                setSelectedItemId(null);
                              }}
                            />
                          </>
                        )}
                        <IconButton
                          icon="trash-can-outline"
                          tone="danger"
                          onPress={() => confirmDelete(item)}
                        />
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
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
