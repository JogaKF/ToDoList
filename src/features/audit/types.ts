export type AuditLogEntry = {
  id: string;
  itemId: string;
  action: string;
  label: string;
  createdAt: string;
  itemTitle: string | null;
  itemType: string | null;
  itemStatus: string | null;
  itemDeletedAt: string | null;
  listId: string | null;
  listName: string | null;
  listType: string | null;
  listDeletedAt: string | null;
};

export type AuditExportFormat = 'json' | 'csv';

export type AuditExportSummary = {
  total: number;
  from: string | null;
  to: string | null;
  actions: number;
};
