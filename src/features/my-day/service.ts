import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsService } from '../items/service';

export const myDayService = {
  getItems(db: SQLiteDatabase) {
    return itemsService.getMyDay(db);
  },
};
