import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../app/providers/PreferencesProvider';
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
  add: '+',
  indent: '⇢',
  outdent: '⇠',
  magnify: '⌕',
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
  const theme = useTheme();

  const iconColor =
    tone === 'primary'
      ? theme.text
      : tone === 'danger'
        ? theme.danger
        : active
          ? theme.primary
          : theme.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary'
          ? {
              backgroundColor: theme.primaryStrong,
              borderColor: theme.primary,
            }
          : tone === 'danger'
            ? {
                backgroundColor: '#33131C',
                borderColor: theme.danger,
              }
            : {
                backgroundColor: theme.panelSoft,
                borderColor: active ? theme.primary : theme.border,
              },
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
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
