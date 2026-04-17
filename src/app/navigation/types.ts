import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  HomeTabs: NavigatorScreenParams<HomeTabParamList>;
  ListDetails: { listId: string };
  TaskPreview: { itemId: string };
};

export type HomeTabParamList = {
  Lists: undefined;
  MyDay: undefined;
  Trash: undefined;
  Settings: undefined;
};
