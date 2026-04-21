import { Text, TextInput, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { AuditExportSummary, AuditLogEntry } from '../../features/audit/types';
import { ui } from '../../theme/ui';
import { formatAuditDateTime, getAuditContext } from './helpers';
import { styles } from './styles';

type ActivityLogContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  entries: AuditLogEntry[];
  allActions: string[];
  selectedAction: string | null;
  searchQuery: string;
  isLoading: boolean;
  isExporting: boolean;
  exportMessage: string | null;
  summary: AuditExportSummary;
  onSetSearchQuery: (value: string) => void;
  onSetSelectedAction: (value: string | null) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
};

export function ActivityLogContent({
  t,
  bottomInset,
  entries,
  allActions,
  selectedAction,
  searchQuery,
  isLoading,
  isExporting,
  exportMessage,
  summary,
  onSetSearchQuery,
  onSetSelectedAction,
  onExportJson,
  onExportCsv,
}: ActivityLogContentProps) {
  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('activity_log_eyebrow')}</Text>
        <Text style={styles.title}>{t('activity_log_title')}</Text>
        <Text style={styles.subtitle}>{t('activity_log_intro')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('activity_log_export_title')}</Text>
        <Text style={styles.sectionHint}>{t('activity_log_export_hint')}</Text>
        <View style={styles.optionGrid}>
          <PrimaryButton label={t('activity_log_export_json')} disabled={isExporting} onPress={onExportJson} />
          <PrimaryButton label={t('activity_log_export_csv')} tone="muted" disabled={isExporting} onPress={onExportCsv} />
        </View>
        {exportMessage ? <StateCard title={t('activity_log_export_status')} description={exportMessage} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('activity_log_filters')}</Text>
        <TextInput
          value={searchQuery}
          onChangeText={onSetSearchQuery}
          style={styles.input}
          placeholder={t('activity_log_search_placeholder')}
          placeholderTextColor={ui.colors.textSoft}
          autoCapitalize="none"
        />
        <View style={styles.optionGrid}>
          <PrimaryButton
            label={t('activity_log_all_actions')}
            tone={selectedAction === null ? 'primary' : 'muted'}
            onPress={() => onSetSelectedAction(null)}
          />
          {allActions.map((action) => (
            <PrimaryButton
              key={action}
              label={action}
              tone={selectedAction === action ? 'primary' : 'muted'}
              onPress={() => onSetSelectedAction(selectedAction === action ? null : action)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('activity_log_summary')}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {t('activity_log_summary_entries')}: {summary.total}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {t('activity_log_summary_actions')}: {summary.actions}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? <StateCard title={t('activity_log_loading')} description={t('activity_log_loading_hint')} /> : null}

      {!isLoading && entries.length === 0 ? (
        <StateCard title={t('activity_log_empty')} description={t('activity_log_empty_hint')} />
      ) : null}

      {!isLoading && entries.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('activity_log_entries')} ({entries.length})
          </Text>
          <View style={styles.entryList}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryAction}>{entry.action}</Text>
                  <Text style={styles.entryTime}>{formatAuditDateTime(entry.createdAt)}</Text>
                </View>
                <Text style={styles.entryLabel}>{entry.label}</Text>
                <Text style={styles.entryContext}>{getAuditContext(entry.itemTitle, entry.listName)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
