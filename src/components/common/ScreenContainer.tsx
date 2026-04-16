import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ui } from '../../theme/ui';

type ScreenContainerProps = PropsWithChildren<{
  bottomInset?: number;
}>;

export function ScreenContainer({ children, bottomInset = 16 }: ScreenContainerProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={styles.backgroundLayer}>
        <View style={styles.orbPrimary} />
        <View style={styles.orbSecondary} />
        <View style={styles.gridLineHorizontal} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.colors.background,
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
    backgroundColor: '#154D82',
    opacity: 0.28,
  },
  orbSecondary: {
    position: 'absolute',
    top: 120,
    left: -110,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#0E6B63',
    opacity: 0.18,
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#14314E',
    opacity: 0.55,
  },
  content: {
    padding: 16,
  },
  inner: {
    gap: 14,
  },
});
