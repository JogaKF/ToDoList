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
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: ui.colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: ui.colors.textMuted,
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(3, 10, 20, 0.34)',
    color: ui.colors.text,
    paddingHorizontal: 14,
  },
  inputLabel: {
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hint: {
    color: ui.colors.textMuted,
    lineHeight: 20,
  },
  error: {
    color: ui.colors.danger,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productCard: {
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 10,
    padding: 14,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  productTitle: {
    color: ui.colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  productMeta: {
    color: ui.colors.textMuted,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
