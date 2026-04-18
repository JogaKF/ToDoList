import type { SQLiteDatabase } from 'expo-sqlite';

import type { DeletedItem, Item, ItemActivity, ItemRelations, PlannedTask, RelatedTaskPreview } from '../../features/items/types';

export function getRelations(db: SQLiteDatabase, itemId: string) {
  return (async () => {
    const item = await db.getFirstAsync<Item>(
      `SELECT * FROM items
       WHERE id = ? AND deletedAt IS NULL`,
      itemId
    );

    if (!item) {
      return {
        parent: null,
        children: [],
      } satisfies ItemRelations;
    }

    const [parent, children] = await Promise.all([
      item.parentId
        ? db.getFirstAsync<RelatedTaskPreview>(
            `SELECT id, title, status, dueDate, myDayDate
             FROM items
             WHERE id = ? AND deletedAt IS NULL`,
            item.parentId
          )
        : Promise.resolve(null),
      db.getAllAsync<RelatedTaskPreview>(
        `SELECT id, title, status, dueDate, myDayDate
         FROM items
         WHERE parentId = ? AND deletedAt IS NULL
         ORDER BY position ASC, createdAt ASC`,
        item.id
      ),
    ]);

    return {
      parent: parent ?? null,
      children,
    } satisfies ItemRelations;
  })();
}

export function getActivity(db: SQLiteDatabase, itemId: string) {
  return db.getAllAsync<ItemActivity>(
    `SELECT * FROM item_activity
     WHERE itemId = ?
     ORDER BY createdAt DESC
     LIMIT 20`,
    itemId
  );
}

export function getMyDay(db: SQLiteDatabase, dateKey: string) {
  return db.getAllAsync<Item>(
    `SELECT * FROM items
     WHERE myDayDate = ? AND deletedAt IS NULL
     ORDER BY position ASC, createdAt ASC`,
    dateKey
  );
}

export function getDeleted(db: SQLiteDatabase) {
  return db.getAllAsync<DeletedItem>(
    `SELECT items.*, lists.name as listName
     FROM items
     INNER JOIN lists ON lists.id = items.listId
     WHERE items.deletedAt IS NOT NULL
       AND lists.deletedAt IS NULL
     ORDER BY items.deletedAt DESC, items.updatedAt DESC`
  );
}

export function getPlannedTasks(db: SQLiteDatabase, mode: 'due' | 'myday') {
  const plannedColumn = mode === 'due' ? 'items.dueDate' : 'items.myDayDate';

  return db.getAllAsync<PlannedTask>(
    `SELECT items.*, lists.name as listName, ${plannedColumn} as plannedDate
     FROM items
     INNER JOIN lists ON lists.id = items.listId
     WHERE items.deletedAt IS NULL
       AND lists.deletedAt IS NULL
       AND items.type = 'task'
       AND items.status = 'todo'
       AND ${plannedColumn} IS NOT NULL
     ORDER BY ${plannedColumn} ASC, items.position ASC, items.createdAt ASC`
  );
}

export function getTasksWithoutDate(db: SQLiteDatabase) {
  return db.getAllAsync<PlannedTask>(
    `SELECT items.*, lists.name as listName, items.dueDate as plannedDate
     FROM items
     INNER JOIN lists ON lists.id = items.listId
     WHERE items.deletedAt IS NULL
       AND lists.deletedAt IS NULL
       AND items.type = 'task'
       AND items.status = 'todo'
       AND items.dueDate IS NULL
     ORDER BY lists.position ASC, items.position ASC, items.createdAt ASC`
  );
}
