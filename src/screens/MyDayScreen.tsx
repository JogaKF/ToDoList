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
import { ui } from '../theme/ui';
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
        <Text style={styles.eyebrow}>Daily focus protocol</Text>
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
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.accent,
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
    color: ui.colors.textMuted,
    lineHeight: 22,
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
    color: ui.colors.textMuted,
  },
  groupCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.72)',
    borderRadius: ui.radius.md,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.3)',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ui.colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  itemCard: {
    gap: 8,
    paddingTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: ui.colors.warning,
    marginTop: 6,
  },
  statusDone: {
    backgroundColor: ui.colors.accent,
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
    color: ui.colors.textSoft,
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
