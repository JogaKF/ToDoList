import type { TodoList, TodoListSummary } from '../../features/lists/types';

export function buildSummariesMap(summaries: TodoListSummary[]) {
  return Object.fromEntries(summaries.map((summary) => [summary.listId, summary]));
}

export function getListTypeLabel(type: TodoList['type']) {
  return type === 'tasks' ? 'Lista taskow' : 'Lista zakupow';
}
