import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.primary,
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
    fontSize: 15,
    lineHeight: 22,
    color: ui.colors.textMuted,
  },
  card: {
    backgroundColor: '#102238',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1B405F',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: ui.colors.text,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.input,
    color: ui.colors.text,
  },
  inputHint: {
    color: ui.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
  },
  inputHintInline: {
    color: ui.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  listGroup: {
    gap: 12,
  },
  listCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
  },
  listCardSelected: {
    backgroundColor: '#132D45',
    borderColor: '#2F7AA2',
  },
  listName: {
    fontSize: 20,
    fontWeight: '700',
    color: ui.colors.text,
  },
  listMeta: {
    color: ui.colors.textSoft,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    backgroundColor: '#10263D',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#234A6C',
  },
  statText: {
    color: ui.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconCluster: {
    flexDirection: 'row',
    gap: 8,
  },
});
