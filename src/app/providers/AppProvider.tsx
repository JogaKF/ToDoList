import { PropsWithChildren } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { initDatabase } from '../../db/init';
import { PreferencesProvider } from './PreferencesProvider';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="todo.db" onInit={initDatabase} useSuspense={false}>
      <PreferencesProvider>{children}</PreferencesProvider>
    </SQLiteProvider>
  );
}
