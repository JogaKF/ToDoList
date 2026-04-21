import type { SQLiteDatabase } from 'expo-sqlite';

import { auditRepository } from '../../db/repositories/auditRepository';
import { buildAuditFilename, createAuditCsv, createAuditJson, getAuditSummary } from './helpers';
import type { AuditExportFormat } from './types';

export const auditService = {
  getEntries(db: SQLiteDatabase) {
    return auditRepository.getEntries(db);
  },

  async createExport(db: SQLiteDatabase, format: AuditExportFormat) {
    const entries = await auditRepository.getEntries(db);
    const exportedAt = new Date().toISOString();

    return {
      filename: buildAuditFilename(format, exportedAt),
      mimeType: format === 'json' ? 'application/json' : 'text/csv',
      content: format === 'json' ? createAuditJson(entries, exportedAt) : createAuditCsv(entries),
      summary: getAuditSummary(entries),
    };
  },
};
