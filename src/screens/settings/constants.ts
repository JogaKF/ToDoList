import type {
  ShoppingGroupPreference,
  ShoppingSortPreference,
  StartTab,
} from '../../app/providers/PreferencesProvider';
import type { ThemeId } from '../../theme/ui';

export const themeOptions: ThemeId[] = ['cyber', 'aurora', 'ember', 'glacier', 'grove', 'custom'];
export const backgroundOptions = ['#07111F', '#06131A', '#170B12', '#102332', '#0F1A14', '#201225'];
export const panelOptions = ['#0F2137', '#11282D', '#291622', '#183047', '#163031', '#352032'];
export const primaryOptions = ['#1499C8', '#3BD6C6', '#FF7B54', '#7DB6FF', '#9BE15D', '#FF8AD8'];
export const startTabOptions: StartTab[] = ['Lists', 'Planner', 'MyDay', 'Trash', 'Settings'];
export const shoppingSortOptions: ShoppingSortPreference[] = ['manual', 'alpha'];
export const shoppingGroupOptions: ShoppingGroupPreference[] = ['flat', 'unit', 'category'];
export const backupImportTypes = ['application/json', 'text/plain'] as const;
