import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UndoBar, useRecovery } from '../../app/providers/RecoveryProvider';
import { useTheme } from '../../app/providers/PreferencesProvider';
import { ui } from '../../theme/ui';

type ScreenContainerProps = PropsWithChildren<{
  bottomInset?: number;
}>;

export function ScreenContainer({ children, bottomInset = 16 }: ScreenContainerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentUndo } = useRecovery();
  const contentBottomInset = bottomInset + (currentUndo ? 130 + Math.max(insets.bottom, 20) : 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <View style={styles.backgroundLayer}>
        <View style={[styles.orbPrimary, { backgroundColor: theme.primary }]} />
        <View style={[styles.orbSecondary, { backgroundColor: theme.accent }]} />
        <View style={[styles.gridLineHorizontal, { backgroundColor: theme.border }]} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      <UndoBar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbPrimary: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    opacity: 0.28,
  },
  orbSecondary: {
    position: 'absolute',
    top: 120,
    left: -110,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.18,
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.55,
  },
  content: {
    padding: 16,
  },
  inner: {
    gap: 14,
  },
});
