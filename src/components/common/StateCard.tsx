import { StyleSheet, Text, View } from 'react-native';

import { ui } from '../../theme/ui';

type StateCardProps = {
  title: string;
  description: string;
  tone?: 'info' | 'warning';
};

export function StateCard({ title, description, tone = 'info' }: StateCardProps) {
  return (
    <View style={[styles.card, tone === 'warning' && styles.warningCard]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E2033',
    borderRadius: ui.radius.md,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(33, 72, 106, 0.22)',
  },
  warningCard: {
    borderColor: 'rgba(255, 184, 107, 0.32)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  description: {
    color: ui.colors.textMuted,
    lineHeight: 21,
  },
});
