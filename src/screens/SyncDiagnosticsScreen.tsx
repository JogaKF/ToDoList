import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useI18n } from '../app/providers/PreferencesProvider';
import { SyncDiagnosticsContent } from './sync-diagnostics/SyncDiagnosticsContent';
import { useSyncDiagnosticsController } from './sync-diagnostics/useSyncDiagnosticsController';

export function SyncDiagnosticsScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const controller = useSyncDiagnosticsController();

  return (
    <SyncDiagnosticsContent
      t={t}
      bottomInset={tabBarHeight + 16}
      state={controller.state}
      recentChanges={controller.recentChanges}
      isLoading={controller.isLoading}
      onRefresh={() => void controller.refresh()}
    />
  );
}
