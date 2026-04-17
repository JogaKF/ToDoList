import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useRecovery } from '../app/providers/RecoveryProvider';
import { useI18n } from '../app/providers/PreferencesProvider';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { DeletedItem } from '../features/items/types';
import { listsService } from '../features/lists/service';
import type { DeletedTodoList } from '../features/lists/types';
import { ui } from '../theme/ui';

type DeletedItemBranch = {
  root: DeletedItem;
  totalItems: number;
  previewTitles: string[];
};

export function TrashScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const { mutationTick } = useRecovery();
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
  }, [loadData, mutationTick]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const deletedListSummaries = useMemo(
    () =>
      deletedLists.map((list) => {
        const relatedItems = deletedItems.filter((item) => item.listId === list.id);
        return {
          ...list,
          itemCount: relatedItems.length,
        };
      }),
    [deletedItems, deletedLists]
  );

  const deletedItemBranches = useMemo<DeletedItemBranch[]>(() => {
    const deletedById = new Map(deletedItems.map((item) => [item.id, item]));
    const childrenByParent = new Map<string, DeletedItem[]>();

    for (const item of deletedItems) {
      if (!item.parentId || !deletedById.has(item.parentId)) {
        continue;
      }

      const bucket = childrenByParent.get(item.parentId) ?? [];
      bucket.push(item);
      bucket.sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt));
      childrenByParent.set(item.parentId, bucket);
    }

    const roots = deletedItems.filter((item) => !item.parentId || !deletedById.has(item.parentId));

    return roots
      .map((root) => {
        const titles: string[] = [];
        let totalItems = 0;

        const visit = (node: DeletedItem) => {
          totalItems += 1;
          if (titles.length < 4) {
            titles.push(node.title);
          }

          for (const child of childrenByParent.get(node.id) ?? []) {
            visit(child);
          }
        };

        visit(root);

        return {
          root,
          totalItems,
          previewTitles: titles,
        };
      })
      .sort((left, right) => right.root.deletedAt.localeCompare(left.root.deletedAt));
  }, [deletedItems]);

  const confirmDeleteListForever = useCallback(
    (list: DeletedTodoList & { itemCount: number }) => {
      Alert.alert(
        'Usunac z kosza na stale?',
        list.itemCount > 0
          ? `Ta lista zniknie bezpowrotnie razem z ${list.itemCount} elementami.`
          : 'Ta lista zniknie bezpowrotnie z lokalnej bazy.',
        [
          {
            text: 'Anuluj',
            style: 'cancel',
          },
          {
            text: 'Usun na stale',
            style: 'destructive',
            onPress: () => {
              void listsService.hardDelete(db, list.id).then(loadData);
            },
          },
        ]
      );
    },
    [db, loadData]
  );

  const confirmDeleteBranchForever = useCallback(
    (branch: DeletedItemBranch) => {
      Alert.alert(
        'Usunac z kosza na stale?',
        branch.totalItems === 1
          ? 'Ten element zniknie bezpowrotnie z lokalnej bazy.'
          : `Ta galaz zniknie bezpowrotnie razem z ${branch.totalItems} elementami.`,
        [
          {
            text: 'Anuluj',
            style: 'cancel',
          },
          {
            text: 'Usun na stale',
            style: 'destructive',
            onPress: () => {
              void itemsService.hardDelete(db, branch.root.id).then(loadData);
            },
          },
        ]
      );
    },
    [db, loadData]
  );

  const confirmClearTrash = useCallback(() => {
    Alert.alert(
      'Oproznic kosz?',
      'Wszystkie usuniete listy i elementy znikna bezpowrotnie z lokalnej bazy.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Oproznij kosz',
          style: 'destructive',
          onPress: () => {
            void listsService.hardDeleteAllDeleted(db).then(loadData);
          },
        },
      ]
    );
  }, [db, loadData]);

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

      {!isLoading && (deletedLists.length > 0 || deletedItems.length > 0) ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton
            label="Oproznij kosz"
            tone="danger"
            onPress={confirmClearTrash}
          />
        </View>
      ) : null}

      {deletedListSummaries.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('trash_deleted_lists')}</Text>
          {deletedListSummaries.map((list) => (
            <View key={list.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{list.name}</Text>
                <Text style={styles.cardMeta}>
                  {list.type === 'tasks' ? 'Lista taskow' : 'Lista zakupow'} | usunieto {list.deletedAt}
                </Text>
                <Text style={styles.cardPreview}>
                  {list.itemCount === 0
                    ? 'Lista wroci bez usunietych elementow.'
                    : `Przywrocenie odzyska ${list.itemCount} lokalnych elementow.`}
                </Text>
              </View>
              <View style={styles.actionRow}>
                <PrimaryButton
                  label={t('trash_restore_list')}
                  onPress={() => {
                    void listsService.restore(db, list.id).then(loadData);
                  }}
                />
                <PrimaryButton
                  label="Usun na stale"
                  tone="danger"
                  onPress={() => confirmDeleteListForever(list)}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {deletedItemBranches.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('trash_deleted_items')}</Text>
          {deletedItemBranches.map((branch) => (
            <View key={branch.root.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{branch.root.title}</Text>
                <Text style={styles.cardMeta}>
                  {branch.root.listName} | usunieto {branch.root.deletedAt}
                </Text>
                <Text style={styles.cardPreview}>
                  {branch.totalItems === 1
                    ? 'Przywrocisz pojedynczy element.'
                    : `Przywrocisz cala galaz (${branch.totalItems} elementow).`}
                </Text>
                <View style={styles.previewList}>
                  {branch.previewTitles.map((title, index) => (
                    <Text key={`${branch.root.id}-${title}-${index}`} style={styles.previewItem}>
                      • {title}
                    </Text>
                  ))}
                  {branch.totalItems > branch.previewTitles.length ? (
                    <Text style={styles.previewItem}>
                      • +{branch.totalItems - branch.previewTitles.length} kolejnych elementow
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actionRow}>
                <PrimaryButton
                  label={t('trash_restore_item')}
                  tone="muted"
                  onPress={() => {
                    void itemsService.restore(db, branch.root.id).then(loadData);
                  }}
                />
                <PrimaryButton
                  label="Usun na stale"
                  tone="danger"
                  onPress={() => confirmDeleteBranchForever(branch)}
                />
              </View>
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
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  cardPreview: {
    color: ui.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  previewList: {
    gap: 3,
    paddingTop: 4,
  },
  previewItem: {
    color: ui.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
