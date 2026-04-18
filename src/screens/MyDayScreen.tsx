import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MyDayStackParamList } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { MyDayContent } from './my-day/MyDayContent';
import { useMyDayController } from './my-day/useMyDayController';

type Navigation = NativeStackNavigationProp<MyDayStackParamList, 'MyDayHome'>;

export function MyDayScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const controller = useMyDayController();

  return (
    <MyDayContent
      t={t}
      bottomInset={tabBarHeight + 16}
      groupedItems={controller.groupedItems}
      expandedIds={controller.expandedIds}
      showCompleted={controller.showCompleted}
      selectedDate={controller.selectedDate}
      isLoading={controller.isLoading}
      onSelectDate={controller.setSelectedDate}
      onToggleExpanded={controller.toggleExpanded}
      onToggleDone={(item) => void controller.handleToggleDone(item)}
      onRemoveFromDay={(itemId) => void controller.handleRemoveFromDay(itemId)}
      onMoveToDay={(itemId, dateKey) => void controller.handleMoveToDay(itemId, dateKey)}
      onRegisterSwipeable={controller.registerSwipeable}
      onOpenPreview={(itemId) => navigation.navigate('TaskPreview', { itemId })}
    />
  );
}
