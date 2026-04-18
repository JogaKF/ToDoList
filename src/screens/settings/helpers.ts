import type { TranslationKey, StartTab } from '../../app/providers/PreferencesProvider';
import type { AppBackupSummary } from '../../features/backup/types';
import type { BackupStatus } from './types';

export function getStartTabTranslationKey(option: StartTab): TranslationKey {
  switch (option) {
    case 'Lists':
      return 'settings_start_lists';
    case 'Planner':
      return 'settings_start_planner';
    case 'MyDay':
      return 'settings_start_my_day';
    case 'Trash':
      return 'settings_start_trash';
    default:
      return 'settings_start_settings';
  }
}

export function formatBackupSummary(t: (key: TranslationKey) => string, summary: AppBackupSummary) {
  return [
    `${t('settings_backup_summary_lists')}: ${summary.lists}`,
    `${t('settings_backup_summary_items')}: ${summary.items}`,
    `${t('settings_backup_summary_deleted')}: ${summary.deletedLists}/${summary.deletedItems}`,
    `${t('settings_backup_summary_settings')}: ${summary.settings}`,
    `${t('settings_backup_summary_activity')}: ${summary.itemActivity}`,
    `${t('settings_backup_summary_categories')}: ${summary.shoppingCategories}`,
    `${t('settings_backup_summary_favorites')}: ${summary.shoppingFavorites}`,
  ].join(' • ');
}

export function getBackupStatusCopy(
  t: (key: TranslationKey) => string,
  status: BackupStatus
): { title: string; description: string; tone: 'info' | 'warning' } {
  switch (status.kind) {
    case 'exported':
      return {
        title: status.mode === 'shared' ? t('settings_backup_status_shared') : t('settings_backup_status_saved'),
        description: `${t('settings_backup_file_label')}: ${status.filename}\n${formatBackupSummary(t, status.summary)}`,
        tone: 'info',
      };
    case 'imported':
      return {
        title: t('settings_backup_status_imported'),
        description: `${t('settings_backup_file_label')}: ${status.filename}\n${formatBackupSummary(t, status.summary)}`,
        tone: 'info',
      };
    case 'error':
      return {
        title: t('settings_backup_status_error'),
        description: status.message,
        tone: 'warning',
      };
    default:
      return {
        title: t('settings_backup_section'),
        description: t('settings_backup_status_idle'),
        tone: 'info',
      };
  }
}
