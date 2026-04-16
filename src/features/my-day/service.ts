import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsService } from '../items/service';
import type { Item } from '../items/types';

export const myDayService = {
  getItems(db: SQLiteDatabase) {
    return itemsService.getMyDay(db);
  },

  toggleDone(db: SQLiteDatabase, item: Item) {
    return itemsService.toggleDone(db, item);
  },

  removeFromDay(db: SQLiteDatabase, itemId: string) {
    return itemsService.removeFromMyDay(db, itemId);
  },
};
