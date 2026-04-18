import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item, ShoppingCategory, ShoppingFavorite, ShoppingHistoryEntry } from '../../features/items/types';
import { createId } from '../../utils/id';
import { nowIso } from '../../utils/date';

export function getShoppingCategories(db: SQLiteDatabase) {
  return db.getAllAsync<ShoppingCategory>(
    `SELECT * FROM shopping_categories
     ORDER BY name COLLATE NOCASE ASC`
  );
}

export async function addShoppingCategory(db: SQLiteDatabase, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const existing = await db.getFirstAsync<ShoppingCategory>(
    `SELECT * FROM shopping_categories
     WHERE LOWER(name) = LOWER(?)`,
    trimmed
  );

  if (existing) {
    return existing;
  }

  const category: ShoppingCategory = {
    id: createId('shopcat'),
    name: trimmed,
    createdAt: nowIso(),
  };

  await db.runAsync(
    `INSERT INTO shopping_categories (id, name, createdAt)
     VALUES (?, ?, ?)`,
    category.id,
    category.name,
    category.createdAt
  );

  return category;
}

export function getShoppingFavorites(db: SQLiteDatabase) {
  return db.getAllAsync<ShoppingFavorite>(
    `SELECT * FROM shopping_favorites
     ORDER BY lastUsedAt DESC, title COLLATE NOCASE ASC`
  );
}

export async function upsertShoppingFavorite(
  db: SQLiteDatabase,
  input: Pick<ShoppingFavorite, 'title' | 'category' | 'quantity' | 'unit'>
) {
  const title = input.title.trim();
  if (!title) {
    return null;
  }

  const category = input.category?.trim() ? input.category.trim() : null;
  const quantity = input.quantity?.trim() ? input.quantity.trim() : null;
  const unit = input.unit?.trim() ? input.unit.trim() : null;
  const timestamp = nowIso();

  const existing = await db.getFirstAsync<ShoppingFavorite>(
    `SELECT * FROM shopping_favorites
     WHERE LOWER(title) = LOWER(?)
       AND COALESCE(LOWER(category), '') = COALESCE(LOWER(?), '')
       AND COALESCE(quantity, '') = COALESCE(?, '')
       AND COALESCE(unit, '') = COALESCE(?, '')`,
    title,
    category,
    quantity,
    unit
  );

  if (existing) {
    await db.runAsync(
      `UPDATE shopping_favorites
       SET updatedAt = ?, lastUsedAt = ?
       WHERE id = ?`,
      timestamp,
      timestamp,
      existing.id
    );

    return {
      ...existing,
      updatedAt: timestamp,
      lastUsedAt: timestamp,
    };
  }

  const favorite: ShoppingFavorite = {
    id: createId('shopfav'),
    title,
    category,
    quantity,
    unit,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUsedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO shopping_favorites (id, title, category, quantity, unit, createdAt, updatedAt, lastUsedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    favorite.id,
    favorite.title,
    favorite.category,
    favorite.quantity,
    favorite.unit,
    favorite.createdAt,
    favorite.updatedAt,
    favorite.lastUsedAt
  );

  return favorite;
}

export function removeShoppingFavorite(
  db: SQLiteDatabase,
  input: Pick<ShoppingFavorite, 'title' | 'category' | 'quantity' | 'unit'>
) {
  return db.runAsync(
    `DELETE FROM shopping_favorites
     WHERE LOWER(title) = LOWER(?)
       AND COALESCE(LOWER(category), '') = COALESCE(LOWER(?), '')
       AND COALESCE(quantity, '') = COALESCE(?, '')
       AND COALESCE(unit, '') = COALESCE(?, '')`,
    input.title.trim(),
    input.category?.trim() ? input.category.trim() : null,
    input.quantity?.trim() ? input.quantity.trim() : null,
    input.unit?.trim() ? input.unit.trim() : null
  );
}

export async function touchShoppingHistory(
  db: SQLiteDatabase,
  input: Pick<Item, 'title' | 'category' | 'quantity' | 'unit'>
) {
  const title = input.title.trim();
  if (!title) {
    return;
  }

  const timestamp = nowIso();
  const existing = await db.getFirstAsync<ShoppingFavorite>(
    `SELECT * FROM shopping_favorites
     WHERE LOWER(title) = LOWER(?)
       AND COALESCE(LOWER(category), '') = COALESCE(LOWER(?), '')
       AND COALESCE(quantity, '') = COALESCE(?, '')
       AND COALESCE(unit, '') = COALESCE(?, '')`,
    title,
    input.category?.trim() ? input.category.trim() : null,
    input.quantity?.trim() ? input.quantity.trim() : null,
    input.unit?.trim() ? input.unit.trim() : null
  );

  if (existing) {
    await db.runAsync(
      `UPDATE shopping_favorites
       SET lastUsedAt = ?, updatedAt = ?
       WHERE id = ?`,
      timestamp,
      timestamp,
      existing.id
    );
  }
}

export async function getShoppingHistory(db: SQLiteDatabase, limit = 12) {
  const allItems = await db.getAllAsync<ShoppingHistoryEntry>(
    `SELECT title, category, quantity, unit, updatedAt as lastUsedAt
     FROM items
     WHERE type = 'shopping'
     ORDER BY updatedAt DESC
     LIMIT 120`
  );

  const seen = new Set<string>();
  const unique: ShoppingHistoryEntry[] = [];

  for (const item of allItems) {
    const key = [
      item.title.trim().toLowerCase(),
      item.category?.trim().toLowerCase() ?? '',
      item.quantity?.trim() ?? '',
      item.unit?.trim() ?? '',
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);

    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}
