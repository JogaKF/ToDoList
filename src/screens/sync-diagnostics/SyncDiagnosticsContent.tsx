import { Text, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { SyncQueueChange, SyncState } from '../../features/sync/types';
import { formatSyncDateTime, getSyncPayloadSummary, getSyncStatusLabel } from './helpers';
import { styles } from './styles';

type SyncDiagnosticsContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  state: SyncState | null;
  recentChanges: SyncQueueChange[];
  isLoading: boolean;
  onRefresh: () => void;
};

function MetricCard({ label, value, isSmall = false }: { label: string; value: string | number; isSmall?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={isSmall ? styles.metricValueSmall : styles.metricValue}>{value}</Text>
    </View>
  );
}

export function SyncDiagnosticsContent({
  t,
  bottomInset,
  state,
  recentChanges,
  isLoading,
  onRefresh,
}: SyncDiagnosticsContentProps) {
  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('sync_diag_eyebrow')}</Text>
        <Text style={styles.title}>{t('sync_diag_title')}</Text>
        <Text style={styles.subtitle}>{t('sync_diag_intro')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.optionGrid}>
          <PrimaryButton label={t('sync_diag_refresh')} disabled={isLoading} onPress={onRefresh} />
        </View>
        <Text style={styles.sectionHint}>{t('sync_diag_refresh_hint')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sync_diag_status_section')}</Text>
        <Text style={styles.sectionHint}>{t('sync_diag_status_hint')}</Text>

        {isLoading && !state ? (
          <StateCard title={t('sync_diag_loading_title')} description={t('sync_diag_loading_hint')} />
        ) : null}

        {state ? (
          <View style={styles.metricGrid}>
            <MetricCard label={t('sync_diag_client_id')} value={state.clientId} isSmall />
            <MetricCard label={t('sync_diag_last_pulled')} value={formatSyncDateTime(state.lastPulledAt) ?? t('sync_diag_never')} />
            <MetricCard label={t('sync_diag_last_pushed')} value={formatSyncDateTime(state.lastPushedAt) ?? t('sync_diag_never')} />
            <MetricCard label={t('sync_diag_pending')} value={state.pendingChanges} />
            <MetricCard label={t('sync_diag_failed')} value={state.failedChanges} />
            <MetricCard label={t('sync_diag_pushed')} value={state.pushedChanges} />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sync_diag_queue_section')}</Text>
        <Text style={styles.sectionHint}>{t('sync_diag_queue_hint')}</Text>

        {!isLoading && recentChanges.length === 0 ? (
          <StateCard title={t('sync_diag_empty_title')} description={t('sync_diag_empty_hint')} />
        ) : null}

        {recentChanges.length > 0 ? (
          <View style={styles.queueList}>
            {recentChanges.map((change) => (
              <View key={change.id} style={styles.queueCard}>
                <View style={styles.queueTopRow}>
                  <Text style={styles.queueOperation}>
                    {change.operation} • {change.entityType}
                  </Text>
                  <Text style={styles.queueStatus}>{getSyncStatusLabel(change.status)}</Text>
                </View>
                <Text style={styles.queueEntity}>{change.entityId}</Text>
                <Text style={styles.queuePayload}>{getSyncPayloadSummary(change.payload)}</Text>
                <Text style={styles.queueMeta}>
                  {t('sync_diag_attempts')}: {change.attempts} • {t('sync_diag_updated_at')}: {formatSyncDateTime(change.updatedAt) ?? change.updatedAt}
                </Text>
                {change.lastError ? <Text style={styles.queueError}>{change.lastError}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
