import { useSQLiteContext } from 'expo-sqlite';

export function useAppDatabase() {
  return useSQLiteContext();
}
