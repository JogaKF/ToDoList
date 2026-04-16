import { Pressable, StyleSheet, Text } from 'react-native';

import { ui } from '../../theme/ui';

const ICON_MAP = {
  'arrow-up': '↑',
  'arrow-down': '↓',
  'weather-sunny': '☼',
  'weather-sunset-down': '◐',
  'pencil-outline': '✎',
  check: '✓',
  close: '✕',
  'trash-can-outline': '⌫',
  'unfold-less-horizontal': '⌃',
  'unfold-more-horizontal': '⌄',
} as const;

type IconName = keyof typeof ICON_MAP;

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  tone?: 'primary' | 'muted' | 'danger';
  active?: boolean;
  disabled?: boolean;
  size?: number;
};

export function IconButton({
  icon,
  onPress,
  tone = 'muted',
  active = false,
  disabled = false,
  size = 18,
}: IconButtonProps) {
  const toneStyle =
    tone === 'primary' ? styles.primary : tone === 'danger' ? styles.danger : styles.muted;

  const iconColor =
    tone === 'primary'
      ? ui.colors.text
      : tone === 'danger'
        ? ui.colors.danger
        : active
          ? ui.colors.primary
          : ui.colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        toneStyle,
        active && tone === 'muted' && styles.activeMuted,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.icon, { color: iconColor, fontSize: size }]}>{ICON_MAP[icon]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    fontWeight: '800',
  },
  primary: {
    backgroundColor: ui.colors.primaryStrong,
    borderColor: ui.colors.primary,
  },
  muted: {
    backgroundColor: ui.colors.panelSoft,
    borderColor: ui.colors.border,
  },
  activeMuted: {
    borderColor: ui.colors.primary,
    backgroundColor: '#12364D',
  },
  danger: {
    backgroundColor: '#33131C',
    borderColor: ui.colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
