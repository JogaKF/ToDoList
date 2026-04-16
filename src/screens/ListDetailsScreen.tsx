import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { flattenVisibleTree } from '../features/items/tree';
import type { ItemTreeNode } from '../features/items/types';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import type { TodoList } from '../features/lists/types';
import { todayKey } from '../utils/date';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ListDetails'>;
type DetailsRoute = RouteProp<RootStackParamList, 'ListDetails'>;

export function ListDetailsScreen() {
  const db = useAppDatabase();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<DetailsRoute>();
  const { expandedIds, toggleExpanded, expandMany } = useTreeUiStore();

  const [list, setList] = useState<TodoList | null>(null);
  const [tree, setTree] = useState<ItemTreeNode[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draftChildren, setDraftChildren] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const listId = route.params.listId;

  const visibleItems = useMemo(() => flattenVisibleTree(tree, expandedIds), [expandedIds, tree]);

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

    await itemsService.createTask(db, listId, newTaskTitle);
    setNewTaskTitle('');
    await loadData();
  }, [db, listId, loadData, newTaskTitle]);

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

  const handleRename = useCallback(
    async (itemId: string) => {
      if (!editingTitle.trim()) {
        return;
      }

      await itemsService.rename(db, itemId, editingTitle);
      setEditingItemId(null);
      setEditingTitle('');
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

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{list?.name ?? 'Lista'}</Text>
        <Text style={styles.headerMeta}>
          {list?.type === 'shopping' ? 'Tryb zakupow' : 'Tryb taskow'}
        </Text>
        <Text style={styles.headerSubmeta}>
          {visibleItems.length} aktywnych pozycji w drzewie
        </Text>
      </View>

      <View style={styles.composerCard}>
        <Text style={styles.sectionTitle}>Nowy task</Text>
        <TextInput
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Dodaj glowny task"
          style={styles.input}
        />
        <PrimaryButton label="Dodaj task" onPress={() => void handleCreateRootTask()} />
      </View>

      <View style={styles.treeWrap}>
        {visibleItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ta lista jest jeszcze pusta</Text>
            <Text style={styles.emptyText}>Dodaj pierwszy task i buduj drzewo przez subtaski.</Text>
          </View>
        ) : null}

        {visibleItems.map((item) => {
          const isEditing = editingItemId === item.id;

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  marginLeft: item.depth * 14,
                  borderLeftWidth: item.depth > 0 ? 3 : 0,
                  borderLeftColor: item.depth > 0 ? '#D8CFBF' : 'transparent',
                },
              ]}
            >
              <View style={styles.itemTopRow}>
                {item.hasChildren ? (
                  <Pressable onPress={() => toggleExpanded(item.id)} style={styles.treeToggle}>
                    <Text style={styles.treeToggleText}>{expandedIds[item.id] ? '-' : '+'}</Text>
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
                    />
                  ) : (
                    <>
                      <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.myDayDate ? `Moj dzien: ${item.myDayDate}` : 'Poza Moim dniem'}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.actionsRow}>
                {isEditing ? (
                  <PrimaryButton label="Zapisz" onPress={() => void handleRename(item.id)} />
                ) : (
                  <PrimaryButton
                    label={item.myDayDate === todayKey() ? 'Usun z dnia' : 'Dodaj na dzis'}
                    onPress={() => void handleToggleMyDay(item)}
                    tone="muted"
                  />
                )}
                {!isEditing ? (
                  <PrimaryButton
                    label="Edytuj"
                    onPress={() => {
                      setEditingItemId(item.id);
                      setEditingTitle(item.title);
                    }}
                    tone="muted"
                  />
                ) : (
                  <PrimaryButton
                    label="Anuluj"
                    onPress={() => {
                      setEditingItemId(null);
                      setEditingTitle('');
                    }}
                    tone="muted"
                  />
                )}
                <PrimaryButton
                  label="Usun"
                  onPress={() => void handleDelete(item.id)}
                  tone="danger"
                />
              </View>

              <View style={styles.childComposer}>
                <TextInput
                  value={draftChildren[item.id] ?? ''}
                  onChangeText={(value) =>
                    setDraftChildren((current) => ({
                      ...current,
                      [item.id]: value,
                    }))
                  }
                  placeholder="Dodaj subtask"
                  style={styles.input}
                />
                <PrimaryButton label="Dodaj subtask" onPress={() => void handleCreateChildTask(item.id)} />
              </View>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#255F38',
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  headerTitle: {
    color: '#FFFDF8',
    fontSize: 28,
    fontWeight: '800',
  },
  headerMeta: {
    color: '#D7E6D2',
    fontSize: 14,
  },
  headerSubmeta: {
    color: '#E9F1E5',
    fontSize: 13,
  },
  composerCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DED6CA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1B18',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D7CEC1',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#1E1B18',
  },
  treeWrap: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DED6CA',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1B18',
  },
  emptyText: {
    fontSize: 14,
    color: '#6E665D',
  },
  itemCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DED6CA',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  treeToggle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeToggleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#403930',
  },
  treeSpacer: {
    width: 28,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#255F38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#255F38',
  },
  checkboxLabel: {
    color: '#FFFDF8',
    fontWeight: '800',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B18',
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: '#7F776E',
  },
  itemMeta: {
    color: '#6B645C',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childComposer: {
    gap: 10,
  },
});
