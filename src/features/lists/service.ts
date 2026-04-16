import type { SQLiteDatabase } from 'expo-sqlite';

import { listsRepository } from '../../db/repositories/listsRepository';

export const listsService = {
  getAll(db: SQLiteDatabase) {
    return listsRepository.getAll(db);
  },

  getById(db: SQLiteDatabase, listId: string) {
    return listsRepository.getById(db, listId);
  },

  create(db: SQLiteDatabase, name: string, type: 'tasks' | 'shopping') {
    return listsRepository.create(db, { name, type });
  },

  rename(db: SQLiteDatabase, listId: string, name: string) {
    return listsRepository.rename(db, listId, name);
  },

  remove(db: SQLiteDatabase, listId: string) {
    return listsRepository.softDelete(db, listId);
  },
};
