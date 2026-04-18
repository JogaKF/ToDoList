import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '../../features/items/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';

export async function getDescendantIdsQuery(db: SQLiteDatabase, rootId: string, includeDeleted = false) {
  const allItems = await db.getAllAsync<Pick<Item, 'id' | 'parentId'>>(
    `SELECT id, parentId FROM items ${includeDeleted ? '' : 'WHERE deletedAt IS NULL'}`
  );

  const childrenByParent = new Map<string, string[]>();
  for (const item of allItems) {
    if (!item.parentId) {
      continue;
    }

    const current = childrenByParent.get(item.parentId) ?? [];
    current.push(item.id);
    childrenByParent.set(item.parentId, current);
  }

  const result: string[] = [];
  const queue = [...(childrenByParent.get(rootId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return result;
}

export async function getSubtreeItemsQuery(db: SQLiteDatabase, rootId: string, includeDeleted = false) {
  const allItems = await db.getAllAsync<Item>(
    `SELECT * FROM items ${includeDeleted ? '' : 'WHERE deletedAt IS NULL'}`
  );

  const itemsById = new Map(allItems.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, Item[]>();

  for (const item of allItems) {
    if (!item.parentId) {
      continue;
    }

    const bucket = childrenByParent.get(item.parentId) ?? [];
    bucket.push(item);
    bucket.sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt));
    childrenByParent.set(item.parentId, bucket);
  }

  const root = itemsById.get(rootId);
  if (!root) {
    return [];
  }

  const result: Item[] = [];
  const visit = (current: Item) => {
    result.push(current);
    for (const child of childrenByParent.get(current.id) ?? []) {
      visit(child);
    }
  };

  visit(root);
  return result;
}

export async function getAncestorIdsQuery(db: SQLiteDatabase, parentId: string | null) {
  if (!parentId) {
    return [];
  }

  const allItems = await db.getAllAsync<Pick<Item, 'id' | 'parentId'>>(
    `SELECT id, parentId FROM items WHERE deletedAt IS NULL`
  );

  const parentById = new Map<string, string | null>();
  for (const item of allItems) {
    parentById.set(item.id, item.parentId);
  }

  const result: string[] = [];
  let currentParentId: string | null = parentId;

  while (currentParentId) {
    result.push(currentParentId);
    currentParentId = parentById.get(currentParentId) ?? null;
  }

  return result;
}

export async function getNextPositionQuery(db: SQLiteDatabase, listId: string, parentId: string | null) {
  const row = await db.getFirstAsync<{ maxPosition: number | null }>(
    `SELECT MAX(position) as maxPosition
     FROM items
     WHERE listId = ?
       AND deletedAt IS NULL
       AND ((parentId IS NULL AND ? IS NULL) OR parentId = ?)`,
    listId,
    parentId,
    parentId
  );

  return (row?.maxPosition ?? 0) + 1000;
}

export async function logItemActivity(db: SQLiteDatabase, itemId: string, action: string, label: string) {
  await db.runAsync(
    `INSERT INTO item_activity (id, itemId, action, label, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    createId('activity'),
    itemId,
    action,
    label,
    nowIso()
  );
}
