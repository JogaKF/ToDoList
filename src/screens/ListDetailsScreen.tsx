import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { collectExpandableIds, flattenVisibleTree } from '../features/items/tree';
import type { ItemTreeNode } from '../features/items/types';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import type { TodoList } from '../features/lists/types';
import { ui } from '../theme/ui';
import { todayKey } from '../utils/date';

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const listId = route.params.listId;
  const isShoppingList = list?.type === 'shopping';

  const visibleItems = useMemo(() => flattenVisibleTree(tree, expandedIds), [expandedIds, tree]);
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
    const [nextList, nextTree] = await Promise.all([
      listsService.getById(db, listId),
      itemsService.getListTree(db, listId),
    ]);

    setList(nextList ?? null);
    setTree(nextTree);
  }, [db, listId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name ?? 'Lista',
    });
  }, [list?.name, navigation]);

  const handleCreateRootTask = useCallback(async () => {
    if (!newTaskTitle.trim()) {
      return;
    }

    if (list?.type === 'shopping') {
      await itemsService.createShoppingItem(db, listId, newTaskTitle);
    } else {
      await itemsService.createTask(db, listId, newTaskTitle);
    }
    setNewTaskTitle('');
    await loadData();
  }, [db, list?.type, listId, loadData, newTaskTitle]);

  const handleCreateChildTask = useCallback(
    async (parentId: string) => {
      const title = draftChildren[parentId]?.trim();
      if (!title) {
        return;
      }

      await itemsService.createTask(db, listId, title, parentId);
      setDraftChildren((current) => ({
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

  const handleRename = useCallback(
    async (itemId: string) => {
      if (!editingTitle.trim()) {
        return;
      }

      await itemsService.rename(db, itemId, editingTitle);
      setEditingItemId(null);
      setEditingTitle('');
      setSelectedItemId(null);
      await loadData();
    },
    [db, editingTitle, loadData]
  );

  const handleToggleMyDay = useCallback(
    async (item: ItemTreeNode) => {
      if (item.myDayDate === todayKey()) {
        await itemsService.removeFromMyDay(db, item.id);
      } else {
        await itemsService.addToMyDay(db, item.id);
      }

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
          onChangeText={setNewTaskTitle}
          placeholder={isShoppingList ? 'Np. Chleb, mleko, jajka' : 'Dodaj glowny task'}
          placeholderTextColor={ui.colors.textSoft}
          style={styles.input}
        />
        <PrimaryButton
          label={isShoppingList ? 'Dodaj produkt' : 'Dodaj task'}
          leadingIcon="+"
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

      <View style={styles.treeWrap}>
        {visibleItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isShoppingList ? 'Lista zakupow jest jeszcze pusta' : 'Ta lista jest jeszcze pusta'}
            </Text>
            <Text style={styles.emptyText}>
              {isShoppingList
                ? 'Dodaj pierwsze produkty i odhaczaj je podczas zakupow.'
                : 'Dodaj pierwszy task i buduj drzewo przez subtaski.'}
            </Text>
          </View>
        ) : null}

        {visibleItems.map((item) => {
          const isEditing = editingItemId === item.id;
          const isSelected = selectedItemId === item.id;
          const canShowChildren = !isShoppingList;
          const isInMyDay = item.myDayDate === todayKey();

          const leftAction = !isShoppingList ? (
            <Pressable
              style={[styles.swipeAction, styles.swipeMyDayAction]}
              onPress={() => void handleToggleMyDay(item)}
            >
              <Text style={styles.swipeActionIcon}>{isInMyDay ? '◐' : '☼'}</Text>
              <Text style={styles.swipeActionText}>{isInMyDay ? 'Usun z dnia' : 'Do Mojego dnia'}</Text>
            </Pressable>
          ) : undefined;

          const rightAction = (
            <Pressable
              style={[styles.swipeAction, styles.swipeDeleteAction]}
              onPress={() => confirmDelete(item)}
            >
              <Text style={styles.swipeActionIconDanger}>⌫</Text>
              <Text style={styles.swipeActionTextDanger}>Usun</Text>
            </Pressable>
          );

          return (
            <Swipeable
              key={item.id}
              renderLeftActions={leftAction ? () => leftAction : undefined}
              renderRightActions={() => rightAction}
              overshootLeft={false}
              overshootRight={false}
              leftThreshold={40}
              rightThreshold={40}
            >
              <Pressable
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
                        onChangeText={setEditingTitle}
                        style={styles.input}
                        placeholder="Nowy tytul"
                        placeholderTextColor={ui.colors.textSoft}
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

                {canShowChildren ? (
                  <View style={styles.childComposer}>
                    {!isEditing && (isSelected || (draftChildren[item.id] ?? '').length > 0) ? (
                      <>
                        <TextInput
                          value={draftChildren[item.id] ?? ''}
                          onChangeText={(value) =>
                            setDraftChildren((current) => ({
                              ...current,
                              [item.id]: value,
                            }))
                          }
                          placeholder={item.parentId ? 'Dodaj kolejny poziom' : 'Dodaj subtask'}
                          placeholderTextColor={ui.colors.textSoft}
                          style={styles.input}
                        />
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
            </Swipeable>
          );
        })}
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
  treeWrap: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyState: {
    backgroundColor: '#0E2033',
    borderRadius: ui.radius.md,
    padding: 18,
    gap: 6,
    borderWidth: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: ui.colors.textMuted,
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
  swipeAction: {
    minWidth: 108,
    marginBottom: 12,
    borderRadius: ui.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  swipeMyDayAction: {
    backgroundColor: ui.colors.accent,
    marginRight: 10,
  },
  swipeDeleteAction: {
    backgroundColor: '#351722',
    borderWidth: 1,
    borderColor: ui.colors.danger,
    marginLeft: 10,
  },
  swipeActionText: {
    color: '#03111A',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  swipeActionTextDanger: {
    color: ui.colors.text,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  swipeActionIcon: {
    color: '#03111A',
    fontSize: 22,
    fontWeight: '800',
  },
  swipeActionIconDanger: {
    color: ui.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
});
