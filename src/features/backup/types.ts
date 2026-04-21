import type {
  Item,
  ItemActivity,
  ShoppingCategory,
  ShoppingDictionaryProduct,
  ShoppingFavorite,
} from '../items/types';
import type { TodoList } from '../lists/types';

export type BackupVersion = 1;

export type BackupSettingsRow = {
  key: string;
  value: string | null;
};

export type AppBackupData = {
  lists: TodoList[];
  items: Item[];
  settings: BackupSettingsRow[];
  itemActivity: ItemActivity[];
  shoppingCategories: ShoppingCategory[];
  shoppingFavorites: ShoppingFavorite[];
  shoppingDictionaryProducts: ShoppingDictionaryProduct[];
};

export type AppBackup = {
  version: BackupVersion;
  exportedAt: string;
  appId: 'todolist';
  data: AppBackupData;
};

export type AppBackupSummary = {
  lists: number;
  items: number;
  deletedLists: number;
  deletedItems: number;
  settings: number;
  itemActivity: number;
  shoppingCategories: number;
  shoppingFavorites: number;
  shoppingDictionaryProducts: number;
};
