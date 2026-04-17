import type { SQLiteDatabase } from 'expo-sqlite';

import { listsRepository } from '../../db/repositories/listsRepository';

export const listsService = {
  getAll(db: SQLiteDatabase) {
    return listsRepository.getAll(db);
  },

  getById(db: SQLiteDatabase, listId: string) {
    return listsRepository.getById(db, listId);
  },

  getDeleted(db: SQLiteDatabase) {
    return listsRepository.getDeleted(db);
  },

  getSummaries(db: SQLiteDatabase) {
    return listsRepository.getSummaries(db);
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

  restore(db: SQLiteDatabase, listId: string) {
    return listsRepository.restore(db, listId);
  },

  hardDelete(db: SQLiteDatabase, listId: string) {
    return listsRepository.hardDelete(db, listId);
  },

  hardDeleteAllDeleted(db: SQLiteDatabase) {
    return listsRepository.hardDeleteAllDeleted(db);
  },

  duplicateShoppingList(db: SQLiteDatabase, listId: string, name?: string) {
    return listsRepository.duplicateShoppingList(db, listId, name);
  },
};
