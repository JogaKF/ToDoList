import { describe, expect, it } from 'vitest';

import type { AuditLogEntry } from './types';
import { createAuditCsv, filterAuditEntries, getAuditSummary } from './helpers';

const entries: AuditLogEntry[] = [
  {
    id: 'activity-1',
    itemId: 'item-1',
    action: 'created',
    label: 'Utworzono zadanie: Kup mleko',
    createdAt: '2026-04-20T10:00:00.000Z',
    itemTitle: 'Kup mleko',
    itemType: 'task',
    itemStatus: 'todo',
    itemDeletedAt: null,
    listId: 'list-1',
    listName: 'Dom',
    listType: 'tasks',
    listDeletedAt: null,
  },
  {
    id: 'activity-2',
    itemId: 'item-2',
    action: 'deleted',
    label: 'Usunieto "stare", do kosza',
    createdAt: '2026-04-21T10:00:00.000Z',
    itemTitle: 'Stare',
    itemType: 'task',
    itemStatus: 'todo',
    itemDeletedAt: '2026-04-21T10:00:00.000Z',
    listId: 'list-1',
    listName: 'Dom',
    listType: 'tasks',
    listDeletedAt: null,
  },
];

describe('audit helpers', () => {
  it('summarizes exported audit entries', () => {
    expect(getAuditSummary(entries)).toEqual({
      total: 2,
      from: '2026-04-20T10:00:00.000Z',
      to: '2026-04-21T10:00:00.000Z',
      actions: 2,
    });
  });

  it('filters by action and free text context', () => {
    expect(filterAuditEntries(entries, 'mleko', null).map((entry) => entry.id)).toEqual(['activity-1']);
    expect(filterAuditEntries(entries, '', 'deleted').map((entry) => entry.id)).toEqual(['activity-2']);
  });

  it('exports safe csv with escaped labels', () => {
    const csv = createAuditCsv(entries);
    expect(csv).toContain('createdAt,action,label,itemId');
    expect(csv).toContain('"Usunieto ""stare"", do kosza"');
  });
});
