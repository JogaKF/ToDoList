import { describe, expect, it } from 'vitest';

import type { DeletedItem } from '../../features/items/types';
import { buildDeletedItemBranches } from './helpers';

function createDeletedItem(overrides: Partial<DeletedItem>): DeletedItem {
  return {
    id: overrides.id ?? 'item',
    listId: overrides.listId ?? 'list-1',
    listName: overrides.listName ?? 'Dom',
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
    deletedAt: overrides.deletedAt ?? '2026-04-18T12:00:00.000Z',
  };
}

describe('trash helpers', () => {
  it('builds deleted branches from roots and descendants', () => {
    const branches = buildDeletedItemBranches([
      createDeletedItem({ id: 'root', title: 'Projekt', deletedAt: '2026-04-18T12:00:00.000Z' }),
      createDeletedItem({ id: 'child-a', parentId: 'root', title: 'Research', position: 1000 }),
      createDeletedItem({ id: 'child-b', parentId: 'root', title: 'Implementacja', position: 2000 }),
      createDeletedItem({ id: 'solo', title: 'Samodzielny', deletedAt: '2026-04-17T12:00:00.000Z' }),
    ]);

    expect(branches).toHaveLength(2);
    expect(branches[0].root.id).toBe('root');
    expect(branches[0].totalItems).toBe(3);
    expect(branches[0].previewTitles).toEqual(['Projekt', 'Research', 'Implementacja']);
    expect(branches[1].root.id).toBe('solo');
  });

  it('treats nodes with missing parents as roots', () => {
    const branches = buildDeletedItemBranches([
      createDeletedItem({ id: 'orphan', parentId: 'missing-parent', title: 'Sierota' }),
    ]);

    expect(branches).toHaveLength(1);
    expect(branches[0].root.id).toBe('orphan');
    expect(branches[0].totalItems).toBe(1);
  });
});
