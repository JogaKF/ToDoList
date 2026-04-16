import { Pressable, StyleSheet, Text } from 'react-native';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary' ? styles.primary : tone === 'danger' ? styles.danger : styles.muted,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, tone === 'muted' && styles.mutedLabel]}>
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
    shadowColor: ui.colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  primary: {
    backgroundColor: ui.colors.primaryStrong,
    borderColor: ui.colors.primary,
  },
  danger: {
    backgroundColor: '#3A1620',
    borderColor: ui.colors.danger,
  },
  muted: {
    backgroundColor: ui.colors.panelSoft,
    borderColor: ui.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: ui.colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  mutedLabel: {
    color: ui.colors.text,
  },
});
