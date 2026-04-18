import { describe, expect, it } from 'vitest';

import type { ItemTreeNode } from '../../features/items/types';
import { buildTemplateKey, formatShoppingSecondaryMeta, getRecurrenceSummary, groupShoppingItems, sortShoppingItems } from './helpers';

function createNode(overrides: Partial<ItemTreeNode>): ItemTreeNode {
  return {
    id: overrides.id ?? 'item',
    listId: overrides.listId ?? 'list-1',
    parentId: overrides.parentId ?? null,
    type: overrides.type ?? 'shopping',
    title: overrides.title ?? 'Mleko',
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
    depth: overrides.depth ?? 0,
    children: overrides.children ?? [],
    hasChildren: overrides.hasChildren ?? false,
  };
}

describe('list details helpers', () => {
  it('sorts shopping items alphabetically only in alpha mode', () => {
    const items = [
      createNode({ title: 'Żurawina', position: 2000 }),
      createNode({ id: '2', title: 'Banan', position: 3000 }),
      createNode({ id: '3', title: 'Ananas', position: 1000 }),
    ];

    expect(sortShoppingItems(items, 'manual').map((item) => item.title)).toEqual(['Żurawina', 'Banan', 'Ananas']);
    expect(sortShoppingItems(items, 'alpha').map((item) => item.title)).toEqual(['Ananas', 'Banan', 'Żurawina']);
  });

  it('groups shopping items by category and pushes empty bucket to the end', () => {
    const items = [
      createNode({ id: '1', title: 'Mleko', category: 'Nabiał' }),
      createNode({ id: '2', title: 'Chleb', category: null }),
      createNode({ id: '3', title: 'Jogurt', category: 'Nabiał' }),
      createNode({ id: '4', title: 'Pomidor', category: 'Warzywa' }),
    ];

    const groups = groupShoppingItems(items, 'category');

    expect(groups.map((group) => group.label)).toEqual(['Nabiał', 'Warzywa', 'Bez kategorii']);
    expect(groups[0].items.map((item) => item.title)).toEqual(['Mleko', 'Jogurt']);
    expect(groups[2].items.map((item) => item.title)).toEqual(['Chleb']);
  });

  it('formats shopping meta and recurrence summary', () => {
    expect(formatShoppingSecondaryMeta(createNode({ category: 'Nabiał', quantity: '2', unit: 'l' }))).toBe('Nabiał • 2 l');
    expect(formatShoppingSecondaryMeta(createNode({ category: null, quantity: null, unit: null }))).toBeNull();
    expect(
      getRecurrenceSummary(
        createNode({
          type: 'task',
          recurrenceType: 'custom',
          recurrenceConfig: '{"interval":3,"unit":"days"}',
        })
      )
    ).toBe('Powtarza sie co 3 dni');
  });

  it('builds a normalized template key', () => {
    expect(
      buildTemplateKey({
        title: '  Mleko  ',
        category: 'Nabiał',
        quantity: '2',
        unit: 'l',
      })
    ).toBe('mleko|nabiał|2|l');
  });
});
