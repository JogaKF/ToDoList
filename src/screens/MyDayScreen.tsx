import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { IconButton } from '../components/common/IconButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { buildItemTree, collectExpandableIds, flattenVisibleTree } from '../features/items/tree';
import { useTreeUiStore } from '../features/items/useTreeUiStore';
import { listsService } from '../features/lists/service';
import { myDayService } from '../features/my-day/service';
import type { Item, ItemTreeNode } from '../features/items/types';
import type { TodoList } from '../features/lists/types';
import { ui } from '../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../utils/date';

type GroupedItems = {
  list: TodoList | undefined;
  tree: ItemTreeNode[];
};

export function MyDayScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const { expandedIds, toggleExpanded, expandMany } = useTreeUiStore();
  const [items, setItems] = useState<Item[]>([]);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextItems, nextLists] = await Promise.all([
      myDayService.getItems(db, selectedDate),
      listsService.getAll(db),
    ]);

    setItems(nextItems);
    setLists(nextLists);
    setIsLoading(false);
  }, [db, selectedDate]);

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
      tree: buildItemTree(
        grouped.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))
      ),
    }));
  }, [items, lists]);

  useEffect(() => {
    const idsToExpand = groupedItems.flatMap((group) => collectExpandableIds(group.tree));
    if (idsToExpand.length > 0) {
      expandMany(idsToExpand);
    }
  }, [expandMany, groupedItems]);

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Daily focus protocol</Text>
        <Text style={styles.title}>Moj dzien</Text>
        <Text style={styles.subtitle}>
          Widok na {formatDateLabel(selectedDate)} oparty wylacznie o lokalna baze i pole `myDayDate`.
        </Text>
      </View>

      <View style={styles.daySwitcher}>
        <PrimaryButton
          label={`Wczoraj ${formatDateLabel(dateKeyWithOffset(-1))}`}
          tone={selectedDate === dateKeyWithOffset(-1) ? 'primary' : 'muted'}
          onPress={() => setSelectedDate(dateKeyWithOffset(-1))}
        />
        <PrimaryButton
          label={`Dzis ${formatDateLabel(todayKey())}`}
          tone={selectedDate === todayKey() ? 'primary' : 'muted'}
          onPress={() => setSelectedDate(todayKey())}
        />
        <PrimaryButton
          label={`Jutro ${formatDateLabel(dateKeyWithOffset(1))}`}
          tone={selectedDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
          onPress={() => setSelectedDate(dateKeyWithOffset(1))}
        />
      </View>

      {isLoading ? (
        <StateCard
          title="Laduje plan dnia"
          description="Zbieram z lokalnej bazy wszystko, co przypisales do wybranego dnia."
        />
      ) : null}

      {!isLoading && groupedItems.length === 0 ? (
        <StateCard
          title="Brak zadan na wybrany dzien"
          description="Otworz dowolna liste i zaplanuj zadanie na dzis albo jutro bez internetu."
        />
      ) : null}

      {groupedItems.map((group) => (
        <View key={group.list?.id ?? 'unknown'} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{group.list?.name ?? 'Nieznana lista'}</Text>
          {flattenVisibleTree(group.tree, expandedIds)
            .filter((item) => item.status === 'todo')
            .map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  marginLeft: item.depth * 12,
                  borderLeftWidth: item.depth > 0 ? 2 : 0,
                  borderLeftColor: item.depth > 0 ? 'rgba(29, 77, 105, 0.65)' : 'transparent',
                },
              ]}
            >
              <View style={styles.itemRow}>
                {item.hasChildren ? (
                  <Pressable onPress={() => toggleExpanded(item.id)} style={styles.treeToggle}>
                    <Text style={styles.treeToggleText}>{expandedIds[item.id] ? '⌄' : '›'}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.treeSpacer} />
                )}
                <Pressable
                  onPress={() => {
                    void myDayService.toggleDone(db, item).then(loadData);
                  }}
                  style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}
                >
                  <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
                </Pressable>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.parentId ? 'Subtask' : 'Glowny task'} | {item.status}
                  </Text>
                </View>
                <IconButton
                  icon="weather-sunset-down"
                  tone="danger"
                  onPress={() => {
                    void myDayService.removeFromDay(db, item.id).then(loadData);
                  }}
                />
              </View>
            </View>
          ))}
          {flattenVisibleTree(group.tree, expandedIds).some((item) => item.status === 'done') ? (
            <View style={styles.doneSection}>
              <Text style={styles.doneSectionTitle}>Zrobione</Text>
              {flattenVisibleTree(group.tree, expandedIds)
                .filter((item) => item.status === 'done')
                .map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        marginLeft: item.depth * 12,
                        borderLeftWidth: item.depth > 0 ? 2 : 0,
                        borderLeftColor: item.depth > 0 ? 'rgba(29, 77, 105, 0.65)' : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.itemRow}>
                      {item.hasChildren ? (
                        <Pressable onPress={() => toggleExpanded(item.id)} style={styles.treeToggle}>
                          <Text style={styles.treeToggleText}>{expandedIds[item.id] ? '⌄' : '›'}</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.treeSpacer} />
                      )}
                      <Pressable
                        onPress={() => {
                          void myDayService.toggleDone(db, item).then(loadData);
                        }}
                        style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}
                      >
                        <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
                      </Pressable>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.parentId ? 'Subtask' : 'Glowny task'} | {item.status}
                        </Text>
                      </View>
                      <IconButton
                        icon="weather-sunny"
                        onPress={() => {
                          void myDayService.moveToDay(db, item.id, dateKeyWithOffset(1)).then(loadData);
                        }}
                      />
                      <IconButton
                        icon="weather-sunset-down"
                        tone="danger"
                        onPress={() => {
                          void myDayService.removeFromDay(db, item.id).then(loadData);
                        }}
                      />
                    </View>
                  </View>
                ))}
            </View>
          ) : null}
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
  daySwitcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 10,
    alignItems: 'flex-start',
  },
  itemCard: {
    paddingVertical: 8,
    borderRadius: 14,
  },
  treeToggle: {
    width: 24,
    height: 24,
    borderRadius: 8,
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
    color: ui.colors.textSoft,
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  doneSection: {
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(25, 56, 82, 0.3)',
  },
  doneSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
