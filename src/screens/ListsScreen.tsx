import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ListsStackParamList } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { ListsContent } from './lists/ListsContent';
import { useListsController } from './lists/useListsController';

type Navigation = NativeStackNavigationProp<ListsStackParamList, 'ListsHome'>;

export function ListsScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const controller = useListsController();

  return (
    <ListsContent
      t={t}
      bottomInset={tabBarHeight + 16}
      lists={controller.lists}
      summaries={controller.summaries}
      newListName={controller.newListName}
      newListType={controller.newListType}
      editingListId={controller.editingListId}
      editingName={controller.editingName}
      selectedListId={controller.selectedListId}
      newListError={controller.newListError}
      editingError={controller.editingError}
      isLoading={controller.isLoading}
      onChangeNewListName={controller.handleChangeNewListName}
      onChangeNewListType={controller.setNewListType}
      onCreateList={() => void controller.handleCreateList()}
      onRenameList={(listId) => void controller.handleRenameList(listId)}
      onDeleteList={(list) => void controller.handleDeleteList(list)}
      onStartEditing={controller.handleStartEditing}
      onChangeEditingName={controller.handleChangeEditingName}
      onCancelEditing={controller.handleCancelEditing}
      onToggleSelectedList={controller.toggleSelectedList}
      onOpenList={(listId) => navigation.navigate('ListDetails', { listId })}
    />
  );
}
