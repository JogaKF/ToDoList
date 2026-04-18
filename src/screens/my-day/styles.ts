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
  daySwitcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.72)',
    borderRadius: ui.radius.md,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.3)',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ui.colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  itemCard: {
    paddingVertical: 8,
    borderRadius: 14,
  },
  treeToggle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeToggleText: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.primary,
  },
  treeSpacer: {
    width: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxDone: {
    backgroundColor: ui.colors.primaryStrong,
  },
  checkboxLabel: {
    color: '#041018',
    fontWeight: '800',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ui.colors.text,
  },
  itemDone: {
    color: ui.colors.textSoft,
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  doneSection: {
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(25, 56, 82, 0.3)',
  },
  doneSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ui.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swipeRemoveAction: {
    minWidth: 128,
    marginVertical: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#471A27',
    borderWidth: 1,
    borderColor: 'rgba(255, 114, 145, 0.34)',
  },
  swipeRemoveText: {
    color: '#FFB8C8',
    fontSize: 13,
    fontWeight: '700',
  },
});
