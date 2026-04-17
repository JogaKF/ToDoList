import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsRepository } from '../../db/repositories/itemsRepository';
import { todayKey } from '../../utils/date';

import type { Item, PlannedTask, RecurrenceConfig, RecurrenceType, RecurrenceUnit, SeriesEditScope } from './types';
import { buildItemTree } from './tree';
import { getUpcomingRecurringDates } from '../../utils/recurrence';

type TaskDetailsInput = {
  category?: string | null;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
  dueDate?: string | null;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
};

function serializeRecurrenceConfig(input: TaskDetailsInput) {
  if (input.recurrenceType !== 'custom') {
    return null;
  }

  const interval = Math.max(1, input.recurrenceInterval ?? 1);
  const unit = input.recurrenceUnit ?? 'weeks';
  const config: RecurrenceConfig = {
    interval,
    unit,
  };

  return JSON.stringify(config);
}

export const itemsService = {
  getById(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.getById(db, itemId);
  },

  async getListTree(db: SQLiteDatabase, listId: string) {
    const items = await itemsRepository.getByListId(db, listId);
    return buildItemTree(items);
  },

  getRelations(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.getRelations(db, itemId);
  },

  getActivity(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.getActivity(db, itemId);
  },

  getMyDay(db: SQLiteDatabase, dateKey = todayKey()) {
    return itemsRepository.getMyDay(db, dateKey);
  },

  getDeleted(db: SQLiteDatabase) {
    return itemsRepository.getDeleted(db);
  },

  createTask(
    db: SQLiteDatabase,
    listId: string,
    title: string,
    parentId?: string | null,
    details?: TaskDetailsInput
  ) {
    return itemsRepository.create(db, {
      listId,
      title,
      parentId: parentId ?? null,
      type: 'task',
      category: details?.category ?? null,
      quantity: details?.quantity ?? null,
      unit: details?.unit ?? null,
      note: details?.note ?? null,
      dueDate: details?.dueDate ?? null,
      recurrenceType: details?.recurrenceType ?? 'none',
      recurrenceConfig: serializeRecurrenceConfig(details ?? {}),
    });
  },

  createShoppingItem(db: SQLiteDatabase, listId: string, title: string, details?: TaskDetailsInput) {
    return itemsRepository.create(db, {
      listId,
      title,
      parentId: null,
      type: 'shopping',
      category: details?.category ?? null,
      quantity: details?.quantity ?? null,
      unit: details?.unit ?? null,
    });
  },

  async createShoppingItems(db: SQLiteDatabase, listId: string, rawValue: string, details?: TaskDetailsInput) {
    const titles = rawValue
      .split(/\n|,|;/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const title of titles) {
      await itemsRepository.create(db, {
        listId,
        title,
        parentId: null,
        type: 'shopping',
        category: details?.category ?? null,
        quantity: details?.quantity ?? null,
        unit: details?.unit ?? null,
      });
    }
  },

  rename(db: SQLiteDatabase, itemId: string, title: string) {
    return itemsRepository.updateTitle(db, itemId, title);
  },

  updateDetails(
    db: SQLiteDatabase,
    itemId: string,
    input: {
      title: string;
      category: string | null;
      quantity: string | null;
      unit: string | null;
      note: string | null;
      dueDate: string | null;
      recurrenceType: RecurrenceType;
      recurrenceInterval?: number;
      recurrenceUnit?: RecurrenceUnit;
    },
    scope: SeriesEditScope = 'single'
  ) {
    return itemsRepository.updateDetails(db, itemId, {
      title: input.title,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      note: input.note,
      dueDate: input.dueDate,
      recurrenceType: input.recurrenceType,
      recurrenceConfig: serializeRecurrenceConfig(input),
    }, scope);
  },

  updateDueDate(db: SQLiteDatabase, itemId: string, dueDate: string | null, scope: SeriesEditScope = 'single') {
    return itemsRepository.updateDueDate(db, itemId, dueDate, scope);
  },

  updateDueDateMany(db: SQLiteDatabase, itemIds: string[], dueDate: string | null) {
    return itemsRepository.updateDueDateMany(db, itemIds, dueDate);
  },

  getPlannedTasks(db: SQLiteDatabase, mode: 'due' | 'myday') {
    return itemsRepository.getPlannedTasks(db, mode);
  },

  getTasksWithoutDate(db: SQLiteDatabase) {
    return itemsRepository.getTasksWithoutDate(db);
  },

  getRecurringPreview(item: Pick<Item, 'dueDate' | 'recurrenceType' | 'recurrenceConfig'>, count = 4) {
    return getUpcomingRecurringDates(item.dueDate, item.recurrenceType, item.recurrenceConfig, count);
  },

  moveWithinSiblings(db: SQLiteDatabase, item: Item, direction: 'up' | 'down') {
    return itemsRepository.moveWithinSiblings(db, item, direction);
  },

  indentUnderPreviousSibling(db: SQLiteDatabase, item: Item) {
    return itemsRepository.indentUnderPreviousSibling(db, item);
  },

  outdentOneLevel(db: SQLiteDatabase, item: Item) {
    return itemsRepository.outdentOneLevel(db, item);
  },

  toggleDone(db: SQLiteDatabase, item: Item) {
    return itemsRepository.toggleStatus(db, item);
  },

  remove(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.softDelete(db, itemId);
  },

  removeMany(db: SQLiteDatabase, itemIds: string[]) {
    return itemsRepository.softDeleteMany(db, itemIds);
  },

  restore(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.restore(db, itemId);
  },

  hardDelete(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.hardDelete(db, itemId);
  },

  hardDeleteAllDeleted(db: SQLiteDatabase) {
    return itemsRepository.hardDeleteAllDeleted(db);
  },

  addToMyDay(db: SQLiteDatabase, itemId: string, dateKey = todayKey()) {
    return itemsRepository.setMyDay(db, itemId, dateKey);
  },

  removeFromMyDay(db: SQLiteDatabase, itemId: string) {
    return itemsRepository.setMyDay(db, itemId, null);
  },
};
