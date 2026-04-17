import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../app/providers/PreferencesProvider';
import { ui } from '../../theme/ui';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'muted';
  leadingIcon?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = 'primary',
  leadingIcon,
}: PrimaryButtonProps) {
  const theme = useTheme();

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
                backgroundColor: '#3A1620',
                borderColor: theme.danger,
              }
            : {
                backgroundColor: theme.panelSoft,
                borderColor: theme.border,
              },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        {
          shadowColor: theme.shadow,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.text }]}>
        {leadingIcon ? `${leadingIcon} ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: ui.radius.pill,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
