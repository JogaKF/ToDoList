export type ItemType = 'task' | 'shopping';
export type ItemStatus = 'todo' | 'done';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'custom';
export type RecurrenceUnit = 'days' | 'weeks' | 'months';

export type RecurrenceConfig = {
  interval: number;
  unit: RecurrenceUnit;
};

export type Item = {
  id: string;
  listId: string;
  parentId: string | null;
  type: ItemType;
  title: string;
  category: string | null;
  quantity: string | null;
  unit: string | null;
  note: string | null;
  status: ItemStatus;
  dueDate: string | null;
  recurrenceType: RecurrenceType;
  recurrenceConfig: string | null;
  recurrenceOriginId: string | null;
  previousRecurringItemId: string | null;
  recurrenceIsException: number;
  myDayDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SeriesEditScope = 'single' | 'series';

export type PlannedTask = Item & {
  listName: string;
  plannedDate: string | null;
};

export type ItemTreeNode = Item & {
  depth: number;
  children: ItemTreeNode[];
  hasChildren: boolean;
};

export type DeletedItem = Item & {
  deletedAt: string;
  listName: string;
};

export type RelatedTaskPreview = Pick<Item, 'id' | 'title' | 'status' | 'dueDate' | 'myDayDate'>;

export type ItemRelations = {
  parent: RelatedTaskPreview | null;
  children: RelatedTaskPreview[];
};

export type ItemActivity = {
  id: string;
  itemId: string;
  action: string;
  label: string;
  createdAt: string;
};
