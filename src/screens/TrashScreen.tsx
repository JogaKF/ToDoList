import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { DeletedItem } from '../features/items/types';
import { listsService } from '../features/lists/service';
import type { DeletedTodoList } from '../features/lists/types';
import { ui } from '../theme/ui';

export function TrashScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const [deletedLists, setDeletedLists] = useState<DeletedTodoList[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextLists, nextItems] = await Promise.all([
      listsService.getDeleted(db),
      itemsService.getDeleted(db),
    ]);

    setDeletedLists(nextLists);
    setDeletedItems(nextItems);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Offline recovery zone</Text>
        <Text style={styles.title}>Kosz</Text>
        <Text style={styles.subtitle}>
          Tu odzyskasz lokalnie usuniete listy i elementy bez backendu i bez syncu.
        </Text>
      </View>

      {isLoading ? (
        <StateCard
          title="Laduje kosz"
          description="Sprawdzam lokalnie, co mozna jeszcze przywrocic."
          tone="warning"
        />
      ) : null}

      {!isLoading && deletedLists.length === 0 && deletedItems.length === 0 ? (
        <StateCard
          title="Kosz jest pusty"
          description="Soft delete dziala. Gdy cos usuniesz, odzyskasz to tutaj."
        />
      ) : null}

      {deletedLists.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuniete listy</Text>
          {deletedLists.map((list) => (
            <View key={list.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{list.name}</Text>
                <Text style={styles.cardMeta}>
                  {list.type === 'tasks' ? 'Lista taskow' : 'Lista zakupow'} | usunieto {list.deletedAt}
                </Text>
              </View>
              <PrimaryButton
                label="Przywroc liste"
                onPress={() => {
                  void listsService.restore(db, list.id).then(loadData);
                }}
              />
            </View>
          ))}
        </View>
      ) : null}

      {deletedItems.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuniete elementy</Text>
          {deletedItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.listName} | usunieto {item.deletedAt}
                </Text>
              </View>
              <PrimaryButton
                label="Przywroc element"
                tone="muted"
                onPress={() => {
                  void itemsService.restore(db, item.id).then(loadData);
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.warning,
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
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  card: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
  },
  cardBody: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.colors.text,
  },
  cardMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
