import { nowIso } from '../../utils/date';
import type { AppBackup, AppBackupSummary } from './types';

export const BACKUP_VERSION = 1 as const;
export const BACKUP_APP_ID = 'todolist' as const;

export function createBackupEnvelope(data: AppBackup['data']): AppBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    appId: BACKUP_APP_ID,
    data,
  };
}

export function parseBackupJson(raw: string): AppBackup {
  const parsed = JSON.parse(raw) as Partial<AppBackup>;

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error('Nieobslugiwana wersja backupu.');
  }

  if (parsed.appId !== BACKUP_APP_ID) {
    throw new Error('Ten plik nie jest backupem tej aplikacji.');
  }

  if (!parsed.data) {
    throw new Error('Backup nie zawiera danych.');
  }

  const {
    lists,
    items,
    settings,
    itemActivity,
    shoppingCategories,
    shoppingFavorites,
    shoppingDictionaryProducts,
  } = parsed.data;

  if (
    !Array.isArray(lists) ||
    !Array.isArray(items) ||
    !Array.isArray(settings) ||
    !Array.isArray(itemActivity) ||
    !Array.isArray(shoppingCategories) ||
    !Array.isArray(shoppingFavorites)
  ) {
    throw new Error('Backup ma niepoprawna strukture.');
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : nowIso(),
    appId: BACKUP_APP_ID,
    data: {
      lists,
      items,
      settings,
      itemActivity,
      shoppingCategories,
      shoppingFavorites,
      shoppingDictionaryProducts: Array.isArray(shoppingDictionaryProducts) ? shoppingDictionaryProducts : [],
    },
  };
}

export function getBackupSummary(backup: AppBackup): AppBackupSummary {
  return {
    lists: backup.data.lists.length,
    items: backup.data.items.length,
    deletedLists: backup.data.lists.filter((list) => list.deletedAt !== null).length,
    deletedItems: backup.data.items.filter((item) => item.deletedAt !== null).length,
    settings: backup.data.settings.length,
    itemActivity: backup.data.itemActivity.length,
    shoppingCategories: backup.data.shoppingCategories.length,
    shoppingFavorites: backup.data.shoppingFavorites.length,
    shoppingDictionaryProducts: backup.data.shoppingDictionaryProducts.length,
  };
}

export function buildBackupFilename(exportedAt: string) {
  const normalized = exportedAt.replace(/[:.]/g, '-');
  return `todolist-backup-${normalized}.json`;
}
