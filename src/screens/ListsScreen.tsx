import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { listsService } from '../features/lists/service';
import type { TodoList, TodoListSummary } from '../features/lists/types';
import { ui } from '../theme/ui';

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
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListError, setNewListError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    const [nextLists, nextSummaries] = await Promise.all([
      listsService.getAll(db),
      listsService.getSummaries(db),
    ]);

    setLists(nextLists);
    setSummaries(
      Object.fromEntries(nextSummaries.map((summary) => [summary.listId, summary]))
    );
    setIsLoading(false);
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
    const nextName = newListName.trim();
    if (!nextName) {
      setNewListError('Podaj nazwe listy.');
      return;
    }

    await listsService.create(db, nextName, newListType);
    setNewListName('');
    setNewListError(null);
    await loadLists();
  }, [db, loadLists, newListName, newListType]);

  const handleRenameList = useCallback(
    async (listId: string) => {
      const nextName = editingName.trim();
      if (!nextName) {
        setEditingError('Nazwa listy nie moze byc pusta.');
        return;
      }

      await listsService.rename(db, listId, nextName);
      setEditingListId(null);
      setEditingName('');
      setEditingError(null);
      setSelectedListId(null);
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
        <Text style={styles.eyebrow}>Offline-first command center</Text>
        <Text style={styles.title}>Twoje listy</Text>
        <Text style={styles.subtitle}>
          Wszystko zapisuje sie lokalnie. Szybko, bez internetu, bez chaosu.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Utworz nowa liste</Text>
        <TextInput
          placeholder="Np. Dom, Praca, Zakupy"
          placeholderTextColor={ui.colors.textSoft}
          value={newListName}
          onChangeText={(value) => {
            setNewListName(value);
            if (value.trim()) {
              setNewListError(null);
            }
          }}
          style={styles.input}
          maxLength={80}
          returnKeyType="done"
          onSubmitEditing={() => void handleCreateList()}
        />
        <Text style={styles.inputHint}>
          {newListError ?? 'Krotka, czytelna nazwa. Wszystko zapisze sie lokalnie.'}
        </Text>
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
        <PrimaryButton
          label="Utworz liste"
          leadingIcon="+"
          disabled={!newListName.trim()}
          onPress={() => void handleCreateList()}
        />
      </View>

      {isLoading ? (
        <StateCard
          title="Laduje lokalne listy"
          description="Czytam dane z SQLite i przygotowuje Twoje centrum dowodzenia."
        />
      ) : null}

      {!isLoading && lists.length === 0 ? (
        <StateCard
          title="Nie masz jeszcze zadnej listy"
          description="Zacznij od jednej listy i potraktuj ja jak swoje lokalne centrum dowodzenia."
        />
      ) : null}

      <View style={styles.listGroup}>
        {lists.map((list) => {
          const isEditing = editingListId === list.id;
          const isSelected = selectedListId === list.id;
          const summary = summaries[list.id];

          return (
            <Pressable
              key={list.id}
              onPress={() => setSelectedListId((current) => (current === list.id ? null : list.id))}
              style={[styles.listCard, isSelected && styles.listCardSelected]}
            >
              {isEditing ? (
                <>
                  <TextInput
                    value={editingName}
                    onChangeText={(value) => {
                      setEditingName(value);
                      if (value.trim()) {
                        setEditingError(null);
                      }
                    }}
                    style={styles.input}
                    placeholder="Nowa nazwa listy"
                    placeholderTextColor={ui.colors.textSoft}
                    autoFocus
                    maxLength={80}
                    returnKeyType="done"
                    onSubmitEditing={() => void handleRenameList(list.id)}
                  />
                  <Text style={styles.inputHintInline}>
                    {editingError ?? 'Nowa nazwa zapisze sie od razu w lokalnej bazie.'}
                  </Text>
                </>
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
                  <>
                    <IconButton
                      icon="check"
                      tone="primary"
                      onPress={() => void handleRenameList(list.id)}
                    />
                    <IconButton
                      icon="close"
                      onPress={() => {
                        setEditingListId(null);
                        setEditingName('');
                        setEditingError(null);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <PrimaryButton
                      label="Otworz"
                      leadingIcon="›"
                      onPress={() => navigation.navigate('ListDetails', { listId: list.id })}
                    />
                    {isSelected ? (
                      <View style={styles.iconCluster}>
                        <IconButton
                          icon="pencil-outline"
                          onPress={() => {
                            setEditingListId(list.id);
                            setEditingName(list.name);
                            setEditingError(null);
                          }}
                        />
                        <IconButton
                          icon="trash-can-outline"
                          tone="danger"
                          onPress={() => void handleDeleteList(list.id)}
                        />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: ui.colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: ui.colors.textMuted,
  },
  card: {
    backgroundColor: '#102238',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1B405F',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: ui.colors.text,
  },
  input: {
    minHeight: 48,
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
    marginTop: -2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  listGroup: {
    gap: 12,
  },
  listCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
  },
  listCardSelected: {
    backgroundColor: '#132D45',
    borderColor: '#2F7AA2',
  },
  listName: {
    fontSize: 20,
    fontWeight: '700',
    color: ui.colors.text,
  },
  listMeta: {
    color: ui.colors.textSoft,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    backgroundColor: '#10263D',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#234A6C',
  },
  statText: {
    color: ui.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconCluster: {
    flexDirection: 'row',
    gap: 8,
  },
});
