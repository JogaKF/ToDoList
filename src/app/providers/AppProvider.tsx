import { PropsWithChildren } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { initDatabase } from '../../db/init';
import { NotificationsProvider } from './NotificationsProvider';
import { PreferencesProvider } from './PreferencesProvider';
import { RecoveryProvider } from './RecoveryProvider';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="todo.db" onInit={initDatabase} useSuspense={false}>
      <PreferencesProvider>
        <RecoveryProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </RecoveryProvider>
      </PreferencesProvider>
    </SQLiteProvider>
  );
}
