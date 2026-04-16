import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsService } from '../items/service';
import type { Item } from '../items/types';

export const myDayService = {
  getItems(db: SQLiteDatabase, dateKey?: string) {
    return itemsService.getMyDay(db, dateKey);
  },

  toggleDone(db: SQLiteDatabase, item: Item) {
    return itemsService.toggleDone(db, item);
  },

  removeFromDay(db: SQLiteDatabase, itemId: string) {
    return itemsService.removeFromMyDay(db, itemId);
  },

  moveToDay(db: SQLiteDatabase, itemId: string, dateKey: string) {
    return itemsService.addToMyDay(db, itemId, dateKey);
  },
};
