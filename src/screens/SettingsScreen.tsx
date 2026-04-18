import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useI18n } from '../app/providers/PreferencesProvider';
import { SettingsContent } from './settings/SettingsContent';
import { useBackupController } from './settings/useBackupController';
import { useSettingsController } from './settings/useSettingsController';

export function SettingsScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const controller = useSettingsController();
  const backupController = useBackupController();

  return (
    <SettingsContent
      t={t}
      bottomInset={tabBarHeight + 16}
      language={controller.language}
      themeId={controller.themeId}
      showCompleted={controller.showCompleted}
      startTab={controller.startTab}
      shoppingSortMode={controller.shoppingSortMode}
      shoppingGroupMode={controller.shoppingGroupMode}
      background={controller.background}
      panel={controller.panel}
      primary={controller.primary}
      onSetLanguage={(value) => void controller.setLanguage(value)}
      onSetTheme={(value) => void controller.setTheme(value as never)}
      onSetShowCompleted={(value) => void controller.setShowCompleted(value)}
      onSetStartTab={(value) => void controller.setStartTab(value)}
      onSetShoppingSortMode={(value) => void controller.setShoppingSortMode(value)}
      onSetShoppingGroupMode={(value) => void controller.setShoppingGroupMode(value)}
      onSetBackground={controller.setBackground}
      onSetPanel={controller.setPanel}
      onSetPrimary={controller.setPrimary}
      onApplyCustomColors={() =>
        void controller.setCustomColors({
          background: controller.background,
          panel: controller.panel,
          primary: controller.primary,
        })
      }
      isBackupBusy={backupController.isBackupBusy}
      backupStatus={backupController.backupStatus}
      onExportBackup={() => void backupController.handleExportBackup()}
      onImportBackup={() => void backupController.handleImportBackup()}
    />
  );
}
