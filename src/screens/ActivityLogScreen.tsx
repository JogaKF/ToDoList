import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useI18n } from '../app/providers/PreferencesProvider';
import { ActivityLogContent } from './activity-log/ActivityLogContent';
import { useActivityLogController } from './activity-log/useActivityLogController';

export function ActivityLogScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const controller = useActivityLogController(t);

  return (
    <ActivityLogContent
      t={t}
      bottomInset={tabBarHeight + 16}
      entries={controller.filteredEntries}
      allActions={controller.allActions}
      selectedAction={controller.selectedAction}
      searchQuery={controller.searchQuery}
      isLoading={controller.isLoading}
      isExporting={controller.isExporting}
      exportMessage={controller.exportMessage}
      summary={controller.summary}
      onSetSearchQuery={controller.setSearchQuery}
      onSetSelectedAction={controller.setSelectedAction}
      onExportJson={() => void controller.handleExport('json')}
      onExportCsv={() => void controller.handleExport('csv')}
    />
  );
}
