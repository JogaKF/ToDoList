import type { StartTab, TranslationKey } from '../../app/providers/PreferencesProvider';

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
