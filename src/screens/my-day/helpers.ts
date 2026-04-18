import { buildItemTree } from '../../features/items/tree';
import type { Item } from '../../features/items/types';
import type { TodoList } from '../../features/lists/types';

export type GroupedItems = {
  list: TodoList | undefined;
  tree: ReturnType<typeof buildItemTree>;
};

export function groupItemsByList(items: Item[], lists: TodoList[]) {
  const map = new Map<string, Item[]>();

  for (const item of items) {
    const bucket = map.get(item.listId) ?? [];
    bucket.push(item);
    map.set(item.listId, bucket);
  }

  return Array.from(map.entries()).map(([listId, grouped]) => ({
    list: lists.find((list) => list.id === listId),
    tree: buildItemTree(grouped.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))),
  }));
}
