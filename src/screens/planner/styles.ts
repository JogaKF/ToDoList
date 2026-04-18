import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: ui.colors.text,
  },
  subtitle: {
    color: ui.colors.textMuted,
    lineHeight: 22,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  sectionCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  summaryCard: {
    backgroundColor: 'rgba(16, 39, 65, 0.84)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2C6D96',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: '13.2%',
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
    backgroundColor: 'rgba(10, 20, 32, 0.72)',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayCellSelected: {
    borderColor: '#2C6D96',
    backgroundColor: '#143048',
  },
  dayCellMuted: {
    opacity: 0.5,
  },
  dayNumber: {
    color: ui.colors.text,
    fontWeight: '700',
  },
  dayNumberMuted: {
    color: ui.colors.textMuted,
  },
  dayBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ui.colors.primaryStrong,
    alignItems: 'center',
  },
  dayBadgeText: {
    color: '#041018',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 48, 72, 0.85)',
  },
  summaryText: {
    color: ui.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  taskCardCompact: {
    paddingVertical: 12,
  },
  taskContent: {
    gap: 4,
    flex: 1,
  },
  taskTitle: {
    color: ui.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  taskMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionHint: {
    color: ui.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  bulkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unscheduledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  unscheduledCardSelected: {
    borderColor: '#2C6D96',
    backgroundColor: '#143048',
  },
  checkboxMini: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMiniText: {
    color: '#041018',
    fontWeight: '800',
  },
  emptyInline: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
});
