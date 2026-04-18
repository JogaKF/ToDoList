import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDatabase } from '../../db/sqlite';
import { useI18n, useTheme } from './PreferencesProvider';
import { ui } from '../../theme/ui';

type UndoAction = {
  id: string;
  label: string;
  perform: (db: SQLiteDatabase) => Promise<void>;
};

type RecoveryContextValue = {
  currentUndo: UndoAction | null;
  mutationTick: number;
  notifyMutation: () => void;
  pushUndoAction: (action: UndoAction) => void;
  clearUndoAction: () => void;
  performUndo: () => Promise<void>;
};

const RecoveryContext = createContext<RecoveryContextValue | null>(null);

const UNDO_TIMEOUT_MS = 8000;

export function RecoveryProvider({ children }: PropsWithChildren) {
  const db = useAppDatabase();
  const [currentUndo, setCurrentUndo] = useState<UndoAction | null>(null);
  const [mutationTick, setMutationTick] = useState(0);

  useEffect(() => {
    if (!currentUndo) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentUndo(null);
    }, UNDO_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [currentUndo]);

  const pushUndoAction = useCallback((action: UndoAction) => {
    setCurrentUndo(action);
  }, []);

  const clearUndoAction = useCallback(() => {
    setCurrentUndo(null);
  }, []);

  const notifyMutation = useCallback(() => {
    setMutationTick((current) => current + 1);
  }, []);

  const performUndo = useCallback(async () => {
    if (!currentUndo) {
      return;
    }

    const action = currentUndo;
    setCurrentUndo(null);
    await action.perform(db);
    notifyMutation();
  }, [currentUndo, db, notifyMutation]);

  const value = useMemo(
    () => ({
      currentUndo,
      mutationTick,
      notifyMutation,
      pushUndoAction,
      clearUndoAction,
      performUndo,
    }),
    [clearUndoAction, currentUndo, mutationTick, notifyMutation, performUndo, pushUndoAction]
  );

  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
}

export function useRecovery() {
  const context = useContext(RecoveryContext);

  if (!context) {
    throw new Error('useRecovery must be used within RecoveryProvider');
  }

  return context;
}

export function UndoBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const { currentUndo, clearUndoAction, performUndo } = useRecovery();

  if (!currentUndo) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.panelStrong,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          bottom: Math.max(insets.bottom, 20) + 16,
        },
      ]}
    >
      <View style={styles.copyWrap}>
        <Text style={[styles.title, { color: theme.text }]}>{t('undo_title')}</Text>
        <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={2}>
          {currentUndo.label}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            void performUndo();
          }}
          style={[
            styles.undoButton,
            {
              backgroundColor: theme.primaryStrong,
              borderColor: theme.primary,
            },
          ]}
        >
          <Text style={[styles.undoLabel, { color: theme.text }]}>Cofnij</Text>
        </Pressable>
        <Pressable
          onPress={clearUndoAction}
          style={[
            styles.dismissButton,
            {
              borderColor: theme.border,
              backgroundColor: theme.panelSoft,
            },
          ]}
        >
          <Text style={[styles.dismissLabel, { color: theme.textSoft }]}>Zamknij</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: ui.radius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  copyWrap: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  undoButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: ui.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  undoLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dismissButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: ui.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dismissLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
