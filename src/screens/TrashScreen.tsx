import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useI18n } from '../app/providers/PreferencesProvider';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { DeletedItem } from '../features/items/types';
import { listsService } from '../features/lists/service';
import type { DeletedTodoList } from '../features/lists/types';
import { ui } from '../theme/ui';

export function TrashScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const t = useI18n();
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
          title={t('trash_loading')}
          description={t('trash_loading_hint')}
          tone="warning"
        />
      ) : null}

      {!isLoading && deletedLists.length === 0 && deletedItems.length === 0 ? (
        <StateCard
          title={t('trash_empty')}
          description={t('trash_empty_hint')}
        />
      ) : null}

      {deletedLists.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('trash_deleted_lists')}</Text>
          {deletedLists.map((list) => (
            <View key={list.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{list.name}</Text>
                <Text style={styles.cardMeta}>
                  {list.type === 'tasks' ? 'Lista taskow' : 'Lista zakupow'} | usunieto {list.deletedAt}
                </Text>
              </View>
              <PrimaryButton
                label={t('trash_restore_list')}
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
          <Text style={styles.sectionTitle}>{t('trash_deleted_items')}</Text>
          {deletedItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.listName} | usunieto {item.deletedAt}
                </Text>
              </View>
              <PrimaryButton
                label={t('trash_restore_item')}
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
