import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n, useTheme } from '../providers/PreferencesProvider';
import { ui } from '../../theme/ui';
import { ListsScreen } from '../../screens/ListsScreen';
import { ListDetailsScreen } from '../../screens/ListDetailsScreen';
import { MyDayScreen } from '../../screens/MyDayScreen';
import { TrashScreen } from '../../screens/TrashScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';

import type { HomeTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeTabs = createBottomTabNavigator<HomeTabParamList>();

function HomeTabsNavigator() {
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const theme = useTheme();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSoft,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          backgroundColor: theme.panelStrong,
          borderTopColor: theme.border,
          borderWidth: 1,
          borderRadius: 24,
          height: 72 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          elevation: 8,
        },
        tabBarItemStyle: {
          borderRadius: 18,
        },
      }}
    >
      <HomeTabs.Screen name="Lists" component={ListsScreen} options={{ title: t('tab_lists') }} />
      <HomeTabs.Screen name="MyDay" component={MyDayScreen} options={{ title: t('tab_my_day') }} />
      <HomeTabs.Screen name="Trash" component={TrashScreen} options={{ title: t('tab_trash') }} />
      <HomeTabs.Screen name="Settings" component={SettingsScreen} options={{ title: t('tab_settings') }} />
    </HomeTabs.Navigator>
  );
}

export function AppNavigator() {
  const t = useI18n();
  const theme = useTheme();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.panel,
      primary: theme.primary,
      border: theme.border,
      text: theme.text,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
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
        }}
      >
        <RootStack.Screen
          name="HomeTabs"
          component={HomeTabsNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="ListDetails"
          component={ListDetailsScreen}
          options={{ title: t('list_details') }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
