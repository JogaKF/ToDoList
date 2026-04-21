import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: ui.colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: ui.colors.textMuted,
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  sectionTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHint: {
    color: ui.colors.textMuted,
    lineHeight: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minWidth: '47%',
    flexGrow: 1,
    gap: 6,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    color: ui.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: ui.colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  queueList: {
    gap: 10,
  },
  queueCard: {
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  queueOperation: {
    color: ui.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  queueStatus: {
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  queueEntity: {
    color: ui.colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  queuePayload: {
    color: ui.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  queueError: {
    color: ui.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  queueMeta: {
    color: ui.colors.textSoft,
    fontSize: 12,
  },
});
