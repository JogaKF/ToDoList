import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useI18n } from '../app/providers/PreferencesProvider';
import { useRecovery } from '../app/providers/RecoveryProvider';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import { listsService } from '../features/lists/service';
import { TrashContent } from './trash/TrashContent';
import { useTrashController } from './trash/useTrashController';

export function TrashScreen() {
  const t = useI18n();
  const db = useAppDatabase();
  const { notifyMutation } = useRecovery();
  const tabBarHeight = useBottomTabBarHeight();
  const controller = useTrashController();

  return (
    <TrashContent
      t={t}
      bottomInset={tabBarHeight + 16}
      deletedListSummaries={controller.deletedListSummaries}
      deletedItemBranches={controller.deletedItemBranches}
      isLoading={controller.isLoading}
      onClearTrash={controller.confirmClearTrash}
      onRestoreList={(listId) => {
        void listsService.restore(db, listId).then(() => {
          notifyMutation();
          return controller.loadData();
        });
      }}
      onDeleteListForever={controller.confirmDeleteListForever}
      onRestoreItem={(itemId) => {
        void itemsService.restore(db, itemId).then(() => {
          notifyMutation();
          return controller.loadData();
        });
      }}
      onDeleteBranchForever={controller.confirmDeleteBranchForever}
    />
  );
}
