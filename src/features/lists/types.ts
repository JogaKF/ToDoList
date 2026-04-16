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
