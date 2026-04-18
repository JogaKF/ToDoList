import { StyleSheet } from 'react-native';

import { ui } from '../../theme/ui';

export const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
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
  section: {
    backgroundColor: 'rgba(12, 27, 43, 0.76)',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.32)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
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
  pickerBlock: {
    gap: 8,
  },
  inputLabel: {
    color: ui.colors.textSoft,
    fontSize: 12,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderColor: ui.colors.white,
  },
  swatchInner: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
