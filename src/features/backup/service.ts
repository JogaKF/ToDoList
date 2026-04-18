import type { SQLiteDatabase } from 'expo-sqlite';

import { backupRepository } from '../../db/repositories/backupRepository';
import { buildBackupFilename, createBackupEnvelope, getBackupSummary, parseBackupJson } from './helpers';
import type { AppBackup } from './types';

export const backupService = {
  async createBackup(db: SQLiteDatabase) {
    const data = await backupRepository.exportAll(db);
    const backup = createBackupEnvelope(data);

    return {
      backup,
      json: JSON.stringify(backup, null, 2),
      filename: buildBackupFilename(backup.exportedAt),
      summary: getBackupSummary(backup),
    };
  },

  parseBackup(raw: string) {
    const backup = parseBackupJson(raw);
    return {
      backup,
      summary: getBackupSummary(backup),
    };
  },

  async importBackup(db: SQLiteDatabase, backup: AppBackup) {
    await backupRepository.replaceAll(db, backup.data);
    return getBackupSummary(backup);
  },
};
