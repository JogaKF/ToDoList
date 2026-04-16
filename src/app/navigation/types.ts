import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  HomeTabs: NavigatorScreenParams<HomeTabParamList>;
  ListDetails: { listId: string };
};

export type HomeTabParamList = {
  Lists: undefined;
  MyDay: undefined;
  Trash: undefined;
};
