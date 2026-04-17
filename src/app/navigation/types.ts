export type TaskPreviewParams = {
  itemId: string;
};

export type ListsStackParamList = {
  ListsHome: undefined;
  ListDetails: { listId: string };
  TaskPreview: TaskPreviewParams;
};

export type MyDayStackParamList = {
  MyDayHome: undefined;
  TaskPreview: TaskPreviewParams;
};

export type PlannerStackParamList = {
  PlannerHome: undefined;
  TaskPreview: TaskPreviewParams;
};

export type HomeTabParamList = {
  Lists: undefined;
  Planner: undefined;
  MyDay: undefined;
  Trash: undefined;
  Settings: undefined;
};
