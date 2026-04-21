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
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.input,
    color: ui.colors.text,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 153, 200, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(20, 153, 200, 0.26)',
  },
  summaryText: {
    color: ui.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  entryList: {
    gap: 10,
  },
  entryCard: {
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryAction: {
    color: ui.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  entryTime: {
    color: ui.colors.textSoft,
    fontSize: 12,
  },
  entryLabel: {
    color: ui.colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  entryContext: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
});
