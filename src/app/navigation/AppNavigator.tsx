import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n, usePreferences, useTheme } from '../providers/PreferencesProvider';
import { ListsScreen } from '../../screens/ListsScreen';
import { ListDetailsScreen } from '../../screens/ListDetailsScreen';
import { PlannerScreen } from '../../screens/PlannerScreen';
import { MyDayScreen } from '../../screens/MyDayScreen';
import { TrashScreen } from '../../screens/TrashScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { TaskPreviewScreen } from '../../screens/TaskPreviewScreen';
import { ProductDictionaryScreen } from '../../screens/ProductDictionaryScreen';

import type {
  HomeTabParamList,
  ListsStackParamList,
  MyDayStackParamList,
  PlannerStackParamList,
  SettingsStackParamList,
} from './types';

const HomeTabs = createBottomTabNavigator<HomeTabParamList>();
const ListsStack = createNativeStackNavigator<ListsStackParamList>();
const MyDayStack = createNativeStackNavigator<MyDayStackParamList>();
const PlannerStack = createNativeStackNavigator<PlannerStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function ListsStackNavigator() {
  const t = useI18n();
  const theme = useTheme();

  return (
    <ListsStack.Navigator
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
      <ListsStack.Screen
        name="ListsHome"
        component={ListsScreen}
        options={{ headerShown: false }}
      />
      <ListsStack.Screen
        name="ListDetails"
        component={ListDetailsScreen}
        options={{ title: t('list_details') }}
      />
      <ListsStack.Screen
        name="TaskPreview"
        component={TaskPreviewScreen}
        options={{ title: t('task_details_title') }}
      />
    </ListsStack.Navigator>
  );
}

function MyDayStackNavigator() {
  const t = useI18n();
  const theme = useTheme();

  return (
    <MyDayStack.Navigator
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
      <MyDayStack.Screen
        name="MyDayHome"
        component={MyDayScreen}
        options={{ headerShown: false }}
      />
      <MyDayStack.Screen
        name="TaskPreview"
        component={TaskPreviewScreen}
        options={{ title: t('task_details_title') }}
      />
    </MyDayStack.Navigator>
  );
}

function PlannerStackNavigator() {
  const t = useI18n();
  const theme = useTheme();

  return (
    <PlannerStack.Navigator
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
      <PlannerStack.Screen
        name="PlannerHome"
        component={PlannerScreen}
        options={{ headerShown: false }}
      />
      <PlannerStack.Screen
        name="TaskPreview"
        component={TaskPreviewScreen}
        options={{ title: t('task_details_title') }}
      />
    </PlannerStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const t = useI18n();
  const theme = useTheme();

  return (
    <SettingsStack.Navigator
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
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="ProductDictionary"
        component={ProductDictionaryScreen}
        options={{ title: t('settings_shopping_dictionary') }}
      />
    </SettingsStack.Navigator>
  );
}

function HomeTabsNavigator() {
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const theme = useTheme();
  const { startTab } = usePreferences();

  return (
    <HomeTabs.Navigator
      key={startTab}
      initialRouteName={startTab}
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
      <HomeTabs.Screen name="Lists" component={ListsStackNavigator} options={{ title: t('tab_lists') }} />
      <HomeTabs.Screen name="Planner" component={PlannerStackNavigator} options={{ title: t('tab_planner') }} />
      <HomeTabs.Screen name="MyDay" component={MyDayStackNavigator} options={{ title: t('tab_my_day') }} />
      <HomeTabs.Screen name="Trash" component={TrashScreen} options={{ title: t('tab_trash') }} />
      <HomeTabs.Screen name="Settings" component={SettingsStackNavigator} options={{ title: t('tab_settings') }} />
    </HomeTabs.Navigator>
  );
}

export function AppNavigator() {
  const theme = useTheme();
  const { isReady } = usePreferences();
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
      {!isReady ? <View style={{ flex: 1, backgroundColor: theme.background }} /> : null}
      {isReady ? <HomeTabsNavigator /> : null}
    </NavigationContainer>
  );
}
