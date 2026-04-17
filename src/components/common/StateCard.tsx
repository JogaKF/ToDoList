import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../app/providers/PreferencesProvider';
import { ui } from '../../theme/ui';

type StateCardProps = {
  title: string;
  description: string;
  tone?: 'info' | 'warning';
};

export function StateCard({ title, description, tone = 'info' }: StateCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: tone === 'warning' ? theme.warning : theme.border,
          backgroundColor: theme.panelSoft,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ui.radius.md,
    padding: 18,
    gap: 6,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    lineHeight: 21,
  },
});
