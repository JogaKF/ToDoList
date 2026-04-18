import { Text, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { DeletedTodoList } from '../../features/lists/types';
import type { DeletedItemBranch } from './helpers';
import { styles } from './styles';

type TrashContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  deletedListSummaries: (DeletedTodoList & { itemCount: number })[];
  deletedItemBranches: DeletedItemBranch[];
  isLoading: boolean;
  onClearTrash: () => void;
  onRestoreList: (listId: string) => void;
  onDeleteListForever: (list: DeletedTodoList & { itemCount: number }) => void;
  onRestoreItem: (itemId: string) => void;
  onDeleteBranchForever: (branch: DeletedItemBranch) => void;
};

export function TrashContent({
  t,
  bottomInset,
  deletedListSummaries,
  deletedItemBranches,
  isLoading,
  onClearTrash,
  onRestoreList,
  onDeleteListForever,
  onRestoreItem,
  onDeleteBranchForever,
}: TrashContentProps) {
  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('trash_eyebrow')}</Text>
        <Text style={styles.title}>{t('trash_title')}</Text>
        <Text style={styles.subtitle}>{t('trash_intro')}</Text>
      </View>

      {isLoading ? <StateCard title={t('trash_loading')} description={t('trash_loading_hint')} tone="warning" /> : null}

      {!isLoading && deletedListSummaries.length === 0 && deletedItemBranches.length === 0 ? (
        <StateCard title={t('trash_empty')} description={t('trash_empty_hint')} />
      ) : null}

      {!isLoading && (deletedListSummaries.length > 0 || deletedItemBranches.length > 0) ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton label="Oproznij kosz" tone="danger" onPress={onClearTrash} />
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
                <PrimaryButton label={t('trash_restore_list')} onPress={() => onRestoreList(list.id)} />
                <PrimaryButton label="Usun na stale" tone="danger" onPress={() => onDeleteListForever(list)} />
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
                  {branch.totalItems === 1 ? 'Przywrocisz pojedynczy element.' : `Przywrocisz cala galaz (${branch.totalItems} elementow).`}
                </Text>
                <View style={styles.previewList}>
                  {branch.previewTitles.map((title, index) => (
                    <Text key={`${branch.root.id}-${title}-${index}`} style={styles.previewItem}>
                      • {title}
                    </Text>
                  ))}
                  {branch.totalItems > branch.previewTitles.length ? (
                    <Text style={styles.previewItem}>• +{branch.totalItems - branch.previewTitles.length} kolejnych elementow</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actionRow}>
                <PrimaryButton label={t('trash_restore_item')} tone="muted" onPress={() => onRestoreItem(branch.root.id)} />
                <PrimaryButton label="Usun na stale" tone="danger" onPress={() => onDeleteBranchForever(branch)} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
