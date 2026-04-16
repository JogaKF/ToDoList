export type ItemType = 'task' | 'shopping';
export type ItemStatus = 'todo' | 'done';

export type Item = {
  id: string;
  listId: string;
  parentId: string | null;
  type: ItemType;
  title: string;
  status: ItemStatus;
  myDayDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ItemTreeNode = Item & {
  depth: number;
  children: ItemTreeNode[];
  hasChildren: boolean;
};
