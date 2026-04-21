import { useLayoutEffect } from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/common/ScreenContainer';
import type { TaskPreviewParams } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { TaskDetailsContent } from './task-preview/TaskDetailsContent';
import { useTaskPreviewController } from './task-preview/useTaskPreviewController';

type TaskPreviewParamList = {
  TaskPreview: TaskPreviewParams;
};

type Navigation = NativeStackNavigationProp<TaskPreviewParamList, 'TaskPreview'>;
type PreviewRoute = RouteProp<TaskPreviewParamList, 'TaskPreview'>;

export function TaskPreviewScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<PreviewRoute>();
  const controller = useTaskPreviewController({ itemId: route.params.itemId });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: controller.item?.title ?? t('task_details_title'),
    });
  }, [controller.item?.title, navigation, t]);

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <TaskDetailsContent
        item={controller.item}
        sourceList={controller.sourceList}
        relations={controller.relations}
        activity={controller.activity}
        draft={controller.draft}
        isTask={Boolean(controller.isTask)}
        isLoading={controller.isLoading}
        isSaving={controller.isSaving}
        saveMessage={controller.saveMessage}
        errorMessage={controller.errorMessage}
        saveScope={controller.saveScope}
        customCategoryName={controller.customCategoryName}
        allShoppingCategoryNames={controller.allShoppingCategoryNames}
        isFavoriteShoppingItem={controller.isFavoriteShoppingItem}
        isRecurringOverdue={controller.isRecurringOverdue}
        nextRecurringDate={controller.nextRecurringDate}
        recurringPreview={controller.recurringPreview}
        onChangeCustomCategoryName={controller.setCustomCategoryName}
        onUpdateDraft={controller.updateDraft}
        onToggleShoppingFavorite={() => void controller.handleToggleShoppingFavorite()}
        onToggleDone={() => void controller.handleToggleDone()}
        onSetMyDayDate={(dateKey) => void controller.handleSetMyDayDate(dateKey)}
        onRescheduleRecurring={(dateKey, scope) => void controller.handleRescheduleRecurring(dateKey, scope)}
        onCatchUpRecurring={() => void controller.handleCatchUpRecurring()}
        onSetSaveScope={controller.setSaveScope}
        onAddCustomCategory={() => void controller.handleAddCustomCategory()}
        onSave={() => void controller.handleSave()}
        onReset={controller.handleReset}
        onOpenSourceList={() => {
          if (!controller.item) {
            return;
          }

          (navigation.getParent() as { navigate: (...args: unknown[]) => void } | undefined)?.navigate('Lists', {
            screen: 'ListDetails',
            params: { listId: controller.item.listId },
          });
        }}
        onOpenParent={(itemId) => navigation.push('TaskPreview', { itemId })}
        onOpenChild={(itemId) => navigation.push('TaskPreview', { itemId })}
      />
    </ScreenContainer>
  );
}
