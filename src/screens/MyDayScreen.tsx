import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useAppDatabase } from '../db/sqlite';
import { listsService } from '../features/lists/service';
import { myDayService } from '../features/my-day/service';
import type { Item } from '../features/items/types';
import type { TodoList } from '../features/lists/types';
import { todayKey } from '../utils/date';

type GroupedItems = {
  list: TodoList | undefined;
  items: Item[];
};

export function MyDayScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const [items, setItems] = useState<Item[]>([]);
  const [lists, setLists] = useState<TodoList[]>([]);

  const loadData = useCallback(async () => {
    const [nextItems, nextLists] = await Promise.all([
      myDayService.getItems(db),
      listsService.getAll(db),
    ]);

    setItems(nextItems);
    setLists(nextLists);
  }, [db]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const groupedItems = useMemo<GroupedItems[]>(() => {
    const map = new Map<string, Item[]>();

    for (const item of items) {
      const bucket = map.get(item.listId) ?? [];
      bucket.push(item);
      map.set(item.listId, bucket);
    }

    return Array.from(map.entries()).map(([listId, grouped]) => ({
      list: lists.find((list) => list.id === listId),
      items: grouped.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)),
    }));
  }, [items, lists]);

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.title}>Moj dzien</Text>
        <Text style={styles.subtitle}>
          Widok na {todayKey()} oparty wylacznie o lokalna baze i pole `myDayDate`.
        </Text>
      </View>

      {groupedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Brak zadan na dzisiaj</Text>
          <Text style={styles.emptyText}>
            Otworz dowolna liste i oznacz zadanie przyciskiem "Dodaj na dzis".
          </Text>
        </View>
      ) : null}

      {groupedItems.map((group) => (
        <View key={group.list?.id ?? 'unknown'} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{group.list?.name ?? 'Nieznana lista'}</Text>
          {group.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={[styles.statusDot, item.status === 'done' && styles.statusDone]} />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.parentId ? 'Subtask' : 'Glowny task'} | {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <PrimaryButton
                  label={item.status === 'done' ? 'Oznacz jako otwarte' : 'Oznacz jako zrobione'}
                  onPress={() => {
                    void myDayService.toggleDone(db, item).then(loadData);
                  }}
                  tone="muted"
                />
                <PrimaryButton
                  label="Usun z Mojego dnia"
                  onPress={() => {
                    void myDayService.removeFromDay(db, item.id).then(loadData);
                  }}
                  tone="danger"
                />
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E1B18',
  },
  subtitle: {
    color: '#645D55',
    lineHeight: 22,
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
  },
  groupCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DED6CA',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1B18',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  itemCard: {
    gap: 10,
    paddingTop: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#D1B178',
    marginTop: 6,
  },
  statusDone: {
    backgroundColor: '#255F38',
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
    color: '#7F776E',
    textDecorationLine: 'line-through',
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
});
