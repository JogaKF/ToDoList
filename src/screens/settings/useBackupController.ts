import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { usePreferences, useI18n } from '../../app/providers/PreferencesProvider';
import { useRecovery } from '../../app/providers/RecoveryProvider';
import { useAppDatabase } from '../../db/sqlite';
import { backupService } from '../../features/backup/service';
import { backupImportTypes } from './constants';
import { formatBackupSummary } from './helpers';
import type { BackupStatus } from './types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown backup error.';
}

function getCancelLabel(language: 'pl' | 'en') {
  return language === 'pl' ? 'Anuluj' : 'Cancel';
}

export function useBackupController() {
  const db = useAppDatabase();
  const t = useI18n();
  const { language, reloadPreferences } = usePreferences();
  const { clearUndoAction, notifyMutation } = useRecovery();
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({ kind: 'idle' });

  const saveBackupFile = useCallback((filename: string, json: string) => {
    const backupDirectory = new Directory(Paths.document, 'backups');
    backupDirectory.create({
      idempotent: true,
      intermediates: true,
    });

    const file = new File(backupDirectory, filename);
    file.create({
      overwrite: true,
      intermediates: true,
    });
    file.write(json);

    return file;
  }, []);

  const handleExportBackup = useCallback(async () => {
    setIsBackupBusy(true);

    try {
      const { filename, json, summary } = await backupService.createBackup(db);
      const file = saveBackupFile(filename, json);
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: t('settings_backup_export'),
        });
      }

      setBackupStatus({
        kind: 'exported',
        mode: canShare ? 'shared' : 'saved',
        filename,
        summary,
      });
    } catch (error) {
      setBackupStatus({
        kind: 'error',
        message: getErrorMessage(error),
      });
    } finally {
      setIsBackupBusy(false);
    }
  }, [db, saveBackupFile, t]);

  const handleImportBackup = useCallback(async () => {
    setIsBackupBusy(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...backupImportTypes],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const file = new File(asset.uri);
      const raw = await file.text();
      const { backup, summary } = backupService.parseBackup(raw);

      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          t('settings_backup_confirm_title'),
          `${t('settings_backup_confirm_hint')}\n\n${formatBackupSummary(t, summary)}`,
          [
            {
              text: getCancelLabel(language),
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: t('settings_backup_import'),
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (!confirmed) {
        return;
      }

      await backupService.importBackup(db, backup);
      clearUndoAction();
      notifyMutation();
      await reloadPreferences();
      setBackupStatus({
        kind: 'imported',
        filename: asset.name || 'backup.json',
        summary,
      });
    } catch (error) {
      setBackupStatus({
        kind: 'error',
        message: getErrorMessage(error),
      });
    } finally {
      setIsBackupBusy(false);
    }
  }, [clearUndoAction, db, language, notifyMutation, reloadPreferences, t]);

  return {
    isBackupBusy,
    backupStatus,
    handleExportBackup,
    handleImportBackup,
  };
}
