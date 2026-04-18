import { describe, expect, it } from 'vitest';

import { buildItemTree, collectExpandableIds, flattenVisibleTree } from './tree';
import type { Item } from './types';

function createItem(overrides: Partial<Item>): Item {
  return {
    id: overrides.id ?? 'item',
    listId: overrides.listId ?? 'list-1',
    parentId: overrides.parentId ?? null,
    type: overrides.type ?? 'task',
    title: overrides.title ?? 'Task',
    category: overrides.category ?? null,
    quantity: overrides.quantity ?? null,
    unit: overrides.unit ?? null,
    note: overrides.note ?? null,
    status: overrides.status ?? 'todo',
    dueDate: overrides.dueDate ?? null,
    recurrenceType: overrides.recurrenceType ?? 'none',
    recurrenceConfig: overrides.recurrenceConfig ?? null,
    recurrenceOriginId: overrides.recurrenceOriginId ?? null,
    previousRecurringItemId: overrides.previousRecurringItemId ?? null,
    recurrenceIsException: overrides.recurrenceIsException ?? 0,
    myDayDate: overrides.myDayDate ?? null,
    position: overrides.position ?? 1000,
    createdAt: overrides.createdAt ?? '2026-04-18T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-18T10:00:00.000Z',
    deletedAt: overrides.deletedAt ?? null,
  };
}

describe('item tree utils', () => {
  const items = [
    createItem({ id: 'root-b', title: 'Root B', position: 2000 }),
    createItem({ id: 'root-a', title: 'Root A', position: 1000 }),
    createItem({ id: 'child-a2', title: 'Child A2', parentId: 'root-a', position: 2000 }),
    createItem({ id: 'child-a1', title: 'Child A1', parentId: 'root-a', position: 1000 }),
    createItem({ id: 'grandchild', title: 'Grandchild', parentId: 'child-a1', position: 1000 }),
    createItem({ id: 'orphan', title: 'Orphan', parentId: 'missing-parent', position: 3000 }),
  ];

  it('builds a sorted tree and normalizes missing parents to roots', () => {
    const tree = buildItemTree(items);

    expect(tree.map((item) => item.id)).toEqual(['root-a', 'root-b', 'orphan']);
    expect(tree[0].children.map((item) => item.id)).toEqual(['child-a1', 'child-a2']);
    expect(tree[0].children[0].children.map((item) => item.id)).toEqual(['grandchild']);
    expect(tree[2].depth).toBe(0);
  });

  it('collects expandable ids recursively', () => {
    const tree = buildItemTree(items);

    expect(collectExpandableIds(tree)).toEqual(['root-a', 'child-a1']);
  });

  it('flattens only expanded branches', () => {
    const tree = buildItemTree(items);

    expect(flattenVisibleTree(tree, {} as Record<string, boolean>).map((item) => item.id)).toEqual([
      'root-a',
      'root-b',
      'orphan',
    ]);

    expect(flattenVisibleTree(tree, { 'root-a': true, 'child-a1': true }).map((item) => item.id)).toEqual([
      'root-a',
      'child-a1',
      'grandchild',
      'child-a2',
      'root-b',
      'orphan',
    ]);
  });
});
