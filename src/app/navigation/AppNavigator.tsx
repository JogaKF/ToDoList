import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    background: '#F4F1EA',
    card: '#FFFDF8',
    primary: '#255F38',
    border: '#DED6CA',
    text: '#1E1B18',
  },
};

function HomeTabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#255F38',
        tabBarInactiveTintColor: '#7C746A',
        tabBarStyle: {
          backgroundColor: '#FFFDF8',
          borderTopColor: '#DED6CA',
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
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
            backgroundColor: '#FFFDF8',
          },
          headerTintColor: '#1E1B18',
          contentStyle: {
            backgroundColor: '#F4F1EA',
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
