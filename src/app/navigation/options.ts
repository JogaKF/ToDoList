import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { ThemeColors } from '../../theme/ui';

export function buildStackScreenOptions(theme: ThemeColors): NativeStackNavigationOptions {
  return {
    headerStyle: {
      backgroundColor: theme.panel,
    },
    headerTintColor: theme.text,
    headerTitleStyle: {
      fontWeight: '800',
    },
    contentStyle: {
      backgroundColor: theme.background,
    },
  };
}
