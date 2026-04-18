import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { PlannerStackParamList } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { PlannerContent } from './planner/PlannerContent';
import { usePlannerController } from './planner/usePlannerController';

type Navigation = NativeStackNavigationProp<PlannerStackParamList, 'PlannerHome'>;

export function PlannerScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const controller = usePlannerController();

  return (
    <PlannerContent
      t={t}
      bottomInset={tabBarHeight + 16}
      mode={controller.mode}
      monthCursor={controller.monthCursor}
      selectedDate={controller.selectedDate}
      selectedTaskIds={controller.selectedTaskIds}
      showWithoutDate={controller.showWithoutDate}
      isLoading={controller.isLoading}
      monthDays={controller.monthDays}
      countsByDate={controller.countsByDate}
      selectedDayTasks={controller.selectedDayTasks}
      overdueTasks={controller.overdueTasks}
      todayTasks={controller.todayTasks}
      upcomingTasks={controller.upcomingTasks}
      tasksWithoutDate={controller.tasksWithoutDate}
      onChangeMode={controller.setMode}
      onMoveMonth={controller.moveMonth}
      onSelectDate={controller.setSelectedDate}
      onToggleWithoutDate={() => controller.setShowWithoutDate((current) => !current)}
      onToggleTaskSelection={controller.toggleTaskSelection}
      onPlanTask={(itemId, dateKey) => void controller.handlePlanTask(itemId, dateKey)}
      onPlanMany={(dateKey) => void controller.handlePlanMany(dateKey)}
      onAddToMyDay={(itemId, dateKey) => void controller.handleAddToMyDay(itemId, dateKey)}
      onRemoveFromMyDay={(itemId) => void controller.handleRemoveFromMyDay(itemId)}
      onOpenPreview={(itemId) => navigation.navigate('TaskPreview', { itemId })}
    />
  );
}
