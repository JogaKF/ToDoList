import { describe, expect, it } from 'vitest';

import { createBackupEnvelope, getBackupSummary, parseBackupJson } from './helpers';
import type { AppBackupData } from './types';

const backupData: AppBackupData = {
  lists: [
    {
      id: 'list-1',
      name: 'Dom',
      type: 'tasks',
      position: 1000,
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'list-2',
      name: 'Kosz',
      type: 'shopping',
      position: 2000,
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      deletedAt: '2026-04-18T10:10:00.000Z',
    },
  ],
  items: [
    {
      id: 'item-1',
      listId: 'list-1',
      parentId: null,
      type: 'task',
      title: 'Task',
      category: null,
      quantity: null,
      unit: null,
      note: null,
      status: 'todo',
      dueDate: null,
      recurrenceType: 'none',
      recurrenceConfig: null,
      recurrenceOriginId: null,
      previousRecurringItemId: null,
      recurrenceIsException: 0,
      myDayDate: null,
      position: 1000,
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'item-2',
      listId: 'list-2',
      parentId: null,
      type: 'shopping',
      title: 'Milk',
      category: 'Nabial',
      quantity: '2',
      unit: 'l',
      note: null,
      status: 'done',
      dueDate: null,
      recurrenceType: 'none',
      recurrenceConfig: null,
      recurrenceOriginId: null,
      previousRecurringItemId: null,
      recurrenceIsException: 0,
      myDayDate: null,
      position: 2000,
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      deletedAt: '2026-04-18T10:10:00.000Z',
    },
  ],
  settings: [{ key: 'language', value: 'pl' }],
  itemActivity: [
    {
      id: 'activity-1',
      itemId: 'item-1',
      action: 'created',
      label: 'Utworzono',
      createdAt: '2026-04-18T10:00:00.000Z',
    },
  ],
  shoppingCategories: [
    {
      id: 'category-1',
      name: 'Nabial',
      createdAt: '2026-04-18T10:00:00.000Z',
    },
  ],
  shoppingFavorites: [
    {
      id: 'favorite-1',
      title: 'Milk',
      category: 'Nabial',
      quantity: '2',
      unit: 'l',
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      lastUsedAt: '2026-04-18T10:00:00.000Z',
    },
  ],
};

describe('backup helpers', () => {
  it('creates a valid backup envelope and parses it back', () => {
    const backup = createBackupEnvelope(backupData);
    const parsed = parseBackupJson(JSON.stringify(backup));

    expect(parsed.appId).toBe('todolist');
    expect(parsed.version).toBe(1);
    expect(parsed.data).toEqual(backupData);
  });

  it('builds a useful backup summary', () => {
    const backup = createBackupEnvelope(backupData);

    expect(getBackupSummary(backup)).toEqual({
      lists: 2,
      items: 2,
      deletedLists: 1,
      deletedItems: 1,
      settings: 1,
      itemActivity: 1,
      shoppingCategories: 1,
      shoppingFavorites: 1,
    });
  });

  it('rejects malformed backup files', () => {
    expect(() => parseBackupJson('{"version":1,"appId":"other","data":{}}')).toThrow('Ten plik nie jest backupem tej aplikacji.');
    expect(() => parseBackupJson('{"version":2,"appId":"todolist","data":{}}')).toThrow('Nieobslugiwana wersja backupu.');
  });
});
