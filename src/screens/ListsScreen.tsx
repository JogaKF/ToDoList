import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useAppDatabase } from '../db/sqlite';
import { listsService } from '../features/lists/service';
import type { TodoList, TodoListSummary } from '../features/lists/types';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ListsScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [summaries, setSummaries] = useState<Record<string, TodoListSummary>>({});
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<TodoList['type']>('tasks');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadLists = useCallback(async () => {
    const [nextLists, nextSummaries] = await Promise.all([
      listsService.getAll(db),
      listsService.getSummaries(db),
    ]);

    setLists(nextLists);
    setSummaries(
      Object.fromEntries(nextSummaries.map((summary) => [summary.listId, summary]))
    );
  }, [db]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useFocusEffect(
    useCallback(() => {
      void loadLists();
    }, [loadLists])
  );

  const handleCreateList = useCallback(async () => {
    if (!newListName.trim()) {
      return;
    }

    await listsService.create(db, newListName, newListType);
    setNewListName('');
    await loadLists();
  }, [db, loadLists, newListName, newListType]);

  const handleRenameList = useCallback(
    async (listId: string) => {
      if (!editingName.trim()) {
        return;
      }

      await listsService.rename(db, listId, editingName);
      setEditingListId(null);
      setEditingName('');
      await loadLists();
    },
    [db, editingName, loadLists]
  );

  const handleDeleteList = useCallback(
    async (listId: string) => {
      await listsService.remove(db, listId);
      await loadLists();
    },
    [db, loadLists]
  );

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Offline-first MVP</Text>
        <Text style={styles.title}>Twoje listy</Text>
        <Text style={styles.subtitle}>
          Lokalna baza jest zrodlem prawdy. Tutaj budujemy prosty produkt, nie kombajn.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nowa lista</Text>
        <TextInput
          placeholder="Np. Dom, Praca, Zakupy"
          value={newListName}
          onChangeText={setNewListName}
          style={styles.input}
        />
        <View style={styles.typeRow}>
          <PrimaryButton
            label="Taski"
            onPress={() => setNewListType('tasks')}
            tone={newListType === 'tasks' ? 'primary' : 'muted'}
          />
          <PrimaryButton
            label="Zakupy"
            onPress={() => setNewListType('shopping')}
            tone={newListType === 'shopping' ? 'primary' : 'muted'}
          />
        </View>
        <PrimaryButton label="Utworz liste" onPress={() => void handleCreateList()} />
      </View>

      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nie masz jeszcze zadnej listy</Text>
          <Text style={styles.emptyText}>
            Zacznij od jednej prostej listy taskow. Zakupy i kolejne widoki spokojnie dolozymy potem.
          </Text>
        </View>
      ) : null}

      <View style={styles.listGroup}>
        {lists.map((list) => {
          const isEditing = editingListId === list.id;
          const summary = summaries[list.id];

          return (
            <View key={list.id} style={styles.listCard}>
              {isEditing ? (
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  style={styles.input}
                  placeholder="Nowa nazwa listy"
                />
              ) : (
                <>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listMeta}>
                    {list.type === 'tasks' ? 'Lista taskow' : 'Lista zakupow'}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.openItems ?? 0} otwarte</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.doneItems ?? 0} zrobione</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.myDayItems ?? 0} w Moim dniu</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.actionsRow}>
                {isEditing ? (
                  <PrimaryButton label="Zapisz" onPress={() => void handleRenameList(list.id)} />
                ) : (
                  <PrimaryButton
                    label="Otworz"
                    onPress={() => navigation.navigate('ListDetails', { listId: list.id })}
                  />
                )}
                {!isEditing ? (
                  <PrimaryButton
                    label="Zmien nazwe"
                    onPress={() => {
                      setEditingListId(list.id);
                      setEditingName(list.name);
                    }}
                    tone="muted"
                  />
                ) : (
                  <PrimaryButton
                    label="Anuluj"
                    onPress={() => {
                      setEditingListId(null);
                      setEditingName('');
                    }}
                    tone="muted"
                  />
                )}
                <PrimaryButton
                  label="Usun"
                  onPress={() => void handleDeleteList(list.id)}
                  tone="danger"
                />
              </View>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 6,
  },
  eyebrow: {
    color: '#255F38',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E1B18',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5D564E',
  },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
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
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D7CEC1',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#1E1B18',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  listGroup: {
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
    color: '#6B645C',
    lineHeight: 21,
  },
  listCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DED6CA',
  },
  listName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1B18',
  },
  listMeta: {
    color: '#70675E',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    backgroundColor: '#EEE6DA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statText: {
    color: '#5A534B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
