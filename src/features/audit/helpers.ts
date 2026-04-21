import { nowIso } from '../../utils/date';
import type { AuditExportSummary, AuditLogEntry } from './types';

const auditExportVersion = 1;
const auditExportAppId = 'todolist-audit';

function csvEscape(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replace(/"/g, '""')}"`;
}

export function getAuditSummary(entries: AuditLogEntry[]): AuditExportSummary {
  const sorted = [...entries].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  return {
    total: entries.length,
    from: sorted[0]?.createdAt ?? null,
    to: sorted[sorted.length - 1]?.createdAt ?? null,
    actions: new Set(entries.map((entry) => entry.action)).size,
  };
}

export function buildAuditFilename(format: 'json' | 'csv', exportedAt = nowIso()) {
  const normalized = exportedAt.replace(/[:.]/g, '-');
  return `todolist-audit-${normalized}.${format}`;
}

export function createAuditJson(entries: AuditLogEntry[], exportedAt = nowIso()) {
  return JSON.stringify(
    {
      version: auditExportVersion,
      appId: auditExportAppId,
      exportedAt,
      summary: getAuditSummary(entries),
      entries,
    },
    null,
    2
  );
}

export function createAuditCsv(entries: AuditLogEntry[]) {
  const headers = [
    'createdAt',
    'action',
    'label',
    'itemId',
    'itemTitle',
    'itemType',
    'itemStatus',
    'itemDeletedAt',
    'listId',
    'listName',
    'listType',
    'listDeletedAt',
  ];

  const rows = entries.map((entry) =>
    [
      entry.createdAt,
      entry.action,
      entry.label,
      entry.itemId,
      entry.itemTitle,
      entry.itemType,
      entry.itemStatus,
      entry.itemDeletedAt,
      entry.listId,
      entry.listName,
      entry.listType,
      entry.listDeletedAt,
    ]
      .map(csvEscape)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function filterAuditEntries(entries: AuditLogEntry[], query: string, action: string | null) {
  const normalizedQuery = query.trim().toLowerCase();

  return entries.filter((entry) => {
    const matchesAction = !action || entry.action === action;
    if (!matchesAction) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = [
      entry.label,
      entry.action,
      entry.itemTitle,
      entry.listName,
      entry.itemType,
      entry.listType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}
