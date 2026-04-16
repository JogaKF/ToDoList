import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ui } from '../../theme/ui';
import { ListsScreen } from '../../screens/ListsScreen';
import { ListDetailsScreen } from '../../screens/ListDetailsScreen';
import { MyDayScreen } from '../../screens/MyDayScreen';

import type { HomeTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeTabs = createBottomTabNavigator<HomeTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: ui.colors.background,
    card: ui.colors.panel,
    primary: ui.colors.primary,
    border: ui.colors.border,
    text: ui.colors.text,
  },
};

function HomeTabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ui.colors.primary,
        tabBarInactiveTintColor: ui.colors.textSoft,
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
          backgroundColor: '#0D1E31',
          borderTopColor: '#1E4667',
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
      <HomeTabs.Screen name="Lists" component={ListsScreen} options={{ title: 'Listy' }} />
      <HomeTabs.Screen name="MyDay" component={MyDayScreen} options={{ title: 'Moj dzien' }} />
    </HomeTabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0C1C2E',
          },
          headerTintColor: ui.colors.text,
          headerTitleStyle: {
            fontWeight: '800',
          },
          contentStyle: {
            backgroundColor: ui.colors.background,
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
          options={{ title: 'Szczegoly listy' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
