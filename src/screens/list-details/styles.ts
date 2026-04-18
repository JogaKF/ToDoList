import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#102741',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2C6D96',
  },
  headerTitle: {
    color: ui.colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  headerMeta: {
    color: ui.colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  headerSubmeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  composerCard: {
    backgroundColor: '#102238',
    borderRadius: ui.radius.md,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1B405F',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
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
    minHeight: 94,
    paddingTop: 14,
  },
  shoppingMetaInput: {
    minWidth: 120,
    flex: 1,
  },
  intervalInput: {
    minWidth: 100,
    flexGrow: 0,
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
  },
  shoppingSupportSection: {
    gap: 8,
  },
  supportTitle: {
    color: ui.colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  supportGrid: {
    gap: 8,
  },
  supportCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
    gap: 4,
  },
  supportCardTitle: {
    color: ui.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  supportCardMeta: {
    color: ui.colors.textMuted,
    fontSize: 12,
  },
  treeWrap: {
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shoppingGroupSection: {
    gap: 10,
  },
  shoppingGroupItems: {
    gap: 12,
  },
  shoppingGroupTitle: {
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  itemCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  itemCardSelected: {
    backgroundColor: '#132D45',
    borderColor: '#2F7AA2',
  },
  itemCardDone: {
    opacity: 0.9,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  shoppingAmountBadge: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#143048',
    borderWidth: 1,
    borderColor: 'rgba(47, 122, 162, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingAmountText: {
    color: ui.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  treeToggle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'transparent',
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
    textDecorationLine: 'line-through',
    color: ui.colors.textSoft,
  },
  itemMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  itemNote: {
    color: ui.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  itemHint: {
    color: ui.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionsRow: {
    gap: 8,
    paddingTop: 2,
  },
  childComposer: {
    gap: 8,
    paddingTop: 2,
  },
  detailsEditor: {
    gap: 8,
    paddingTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtaskActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  iconCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  doneSection: {
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(25, 56, 82, 0.32)',
  },
  doneSectionTitle: {
    color: ui.colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swipeAction: {
    minWidth: 120,
    marginVertical: 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  swipeMyDayAction: {
    backgroundColor: '#143D4A',
    borderWidth: 1,
    borderColor: 'rgba(74, 196, 255, 0.32)',
  },
  swipeDeleteAction: {
    backgroundColor: '#471A27',
    borderWidth: 1,
    borderColor: 'rgba(255, 114, 145, 0.34)',
  },
  swipeMyDayText: {
    color: '#8BE4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeDeleteText: {
    color: '#FFB8C8',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeSpacer: {
    width: 12,
  },
});
