import type { AppBackupSummary } from '../../features/backup/types';

export type BackupStatus =
  | {
      kind: 'idle';
    }
  | {
      kind: 'exported';
      mode: 'shared' | 'saved';
      filename: string;
      summary: AppBackupSummary;
    }
  | {
      kind: 'imported';
      filename: string;
      summary: AppBackupSummary;
    }
  | {
      kind: 'error';
      message: string;
    };
