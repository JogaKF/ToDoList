import { useCallback, useEffect, useMemo, useState } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { useAppDatabase } from '../../db/sqlite';
import { auditService } from '../../features/audit/service';
import type { AuditExportFormat, AuditLogEntry } from '../../features/audit/types';
import { filterAuditEntries, getAuditSummary } from '../../features/audit/helpers';

type Translator = (key: TranslationKey) => string;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown audit export error.';
}

export function useActivityLogController(t: Translator) {
  const db = useAppDatabase();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    const nextEntries = await auditService.getEntries(db);
    setEntries(nextEntries);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries])
  );

  const allActions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.action))).sort((left, right) => left.localeCompare(right)),
    [entries]
  );

  const filteredEntries = useMemo(
    () => filterAuditEntries(entries, searchQuery, selectedAction),
    [entries, searchQuery, selectedAction]
  );

  const summary = useMemo(() => getAuditSummary(filteredEntries), [filteredEntries]);

  const saveAuditFile = useCallback((filename: string, content: string) => {
    const auditDirectory = new Directory(Paths.document, 'audit');
    auditDirectory.create({
      idempotent: true,
      intermediates: true,
    });

    const file = new File(auditDirectory, filename);
    file.create({
      overwrite: true,
      intermediates: true,
    });
    file.write(content);

    return file;
  }, []);

  const handleExport = useCallback(
    async (format: AuditExportFormat) => {
      setIsExporting(true);
      setExportMessage(null);

      try {
        const { filename, content, mimeType } = await auditService.createExport(db, format);
        const file = saveAuditFile(filename, content);
        const canShare = await Sharing.isAvailableAsync();

        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType,
            dialogTitle: t('activity_log_export_title'),
          });
        }

        setExportMessage(
          canShare
            ? `${t('activity_log_export_shared')}: ${filename}`
            : `${t('activity_log_export_saved')}: ${filename}`
        );
      } catch (error) {
        setExportMessage(`${t('activity_log_export_error')}: ${getErrorMessage(error)}`);
      } finally {
        setIsExporting(false);
      }
    },
    [db, saveAuditFile, t]
  );

  return {
    entries,
    filteredEntries,
    allActions,
    selectedAction,
    setSelectedAction,
    searchQuery,
    setSearchQuery,
    isLoading,
    isExporting,
    exportMessage,
    summary,
    handleExport,
  };
}
