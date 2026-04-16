export type ListType = 'tasks' | 'shopping';

export type TodoList = {
  id: string;
  name: string;
  type: ListType;
  position: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TodoListSummary = {
  listId: string;
  totalItems: number;
  openItems: number;
  doneItems: number;
  myDayItems: number;
};

export type DeletedTodoList = TodoList & {
  deletedAt: string;
};
