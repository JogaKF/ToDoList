import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsRepository } from '../../db/repositories/itemsRepository';
import { todayKey } from '../../utils/date';

import type { Item } from './types';
import { buildItemTree } from './tree';

export const itemsService = {
  async getListTree(db: SQLiteDatabase, listId: string) {
    const items = await itemsRepository.getByListId(db, listId);
    return buildItemTree(items);
  },

  getMyDay(db: SQLiteDatabase, dateKey = todayKey()) {
    return itemsRepository.getMyDay(db, dateKey);
  },

  createTask(db: SQLiteDatabase, listId: string, title: string, parentId?: string | null) {
    return itemsRepository.create(db, {
      listId,
      title,
      parentId: parentId ?? null,
      type: 'task',
    });
  },

  createShoppingItem(db: SQLiteDatabase, listId: string, title: string) {
    return itemsRepository.create(db, {
      listId,
      title,
      parentId: null,
      type: 'shopping',
    });
  },

  rename(db: SQLiteDatabase, itemId: string, title: string) {
    return itemsRepository.updateTitle(db, itemId, title);
  },

  moveWithinSiblings(db: SQLiteDatabase, item: Item, direction: 'up' | 'down') {
    return itemsRepository.moveWithinSiblings(db, item, direction);
  },

  toggleDone(db: SQLiteDatabase, item: Item) {
    return itemsRepository.toggleStatus(db, item);
  },

  remove(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.softDelete(db, itemId);
  },

  addToMyDay(db: SQLiteDatabase, itemId: string, dateKey = todayKey()) {
    return itemsRepository.setMyDay(db, itemId, dateKey);
  },

  removeFromMyDay(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.setMyDay(db, itemId, null);
  },
};
