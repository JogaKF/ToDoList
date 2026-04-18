import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: ui.colors.text,
    flex: 1,
  },
  meta: {
    color: ui.colors.textMuted,
    fontSize: 14,
  },
  supportingMeta: {
    color: ui.colors.textSoft,
    fontSize: 13,
  },
  overdueCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#2E1B10',
    borderWidth: 1,
    borderColor: '#9C6630',
  },
  overdueTitle: {
    color: '#FFD099',
    fontSize: 15,
    fontWeight: '700',
  },
  overdueText: {
    color: '#F2D6B1',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: ui.colors.textSoft,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: ui.colors.text,
    fontSize: 15,
  },
  inlineActions: {
    gap: 8,
  },
  relationBlock: {
    gap: 8,
  },
  relatedList: {
    gap: 8,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  relatedMeta: {
    color: ui.colors.textMuted,
    fontSize: 12,
  },
  historyCard: {
    gap: 4,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  historyLabel: {
    color: ui.colors.text,
    fontSize: 14,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.input,
    color: ui.colors.text,
  },
  noteInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  fieldWrap: {
    flex: 1,
    gap: 8,
  },
  fieldWrapWide: {
    flex: 2,
    gap: 8,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopeHint: {
    color: ui.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  successText: {
    color: '#8BE3B0',
    fontSize: 13,
  },
  errorText: {
    color: '#FF8F8F',
    fontSize: 13,
  },
});
