import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { useAppDatabase } from '../../db/sqlite';
import { listsService } from '../../features/lists/service';
import type { TodoList, TodoListSummary } from '../../features/lists/types';
import { buildSummariesMap } from './helpers';

export function useListsController() {
  const db = useAppDatabase();
  const { pushUndoAction, mutationTick, notifyMutation } = useRecovery();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [summaries, setSummaries] = useState<Record<string, TodoListSummary>>({});
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<TodoList['type']>('tasks');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListError, setNewListError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    const [nextLists, nextSummaries] = await Promise.all([listsService.getAll(db), listsService.getSummaries(db)]);

    setLists(nextLists);
    setSummaries(buildSummariesMap(nextSummaries));
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void loadLists();
  }, [loadLists, mutationTick]);

  useFocusEffect(
    useCallback(() => {
      void loadLists();
    }, [loadLists])
  );

  const handleCreateList = useCallback(async () => {
    const nextName = newListName.trim();
    if (!nextName) {
      setNewListError('Podaj nazwe listy.');
      return;
    }

    await listsService.create(db, nextName, newListType);
    setNewListName('');
    setNewListError(null);
    await loadLists();
  }, [db, loadLists, newListName, newListType]);

  const handleRenameList = useCallback(
    async (listId: string) => {
      const nextName = editingName.trim();
      if (!nextName) {
        setEditingError('Nazwa listy nie moze byc pusta.');
        return;
      }

      await listsService.rename(db, listId, nextName);
      setEditingListId(null);
      setEditingName('');
      setEditingError(null);
      setSelectedListId(null);
      await loadLists();
    },
    [db, editingName, loadLists]
  );

  const handleDeleteList = useCallback(
    async (list: TodoList) => {
      await listsService.remove(db, list.id);
      pushUndoAction({
        id: `delete-list-${list.id}-${Date.now()}`,
        label: `Usunieto liste: ${list.name}`,
        perform: async (undoDb) => {
          await listsService.restore(undoDb, list.id);
        },
      });
      notifyMutation();
      await loadLists();
    },
    [db, loadLists, notifyMutation, pushUndoAction]
  );

  const handleChangeNewListName = useCallback((value: string) => {
    setNewListName(value);
    if (value.trim()) {
      setNewListError(null);
    }
  }, []);

  const handleStartEditing = useCallback((list: TodoList) => {
    setEditingListId(list.id);
    setEditingName(list.name);
    setEditingError(null);
  }, []);

  const handleChangeEditingName = useCallback((value: string) => {
    setEditingName(value);
    if (value.trim()) {
      setEditingError(null);
    }
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditingListId(null);
    setEditingName('');
    setEditingError(null);
  }, []);

  const toggleSelectedList = useCallback((listId: string) => {
    setSelectedListId((current) => (current === listId ? null : listId));
  }, []);

  return {
    lists,
    summaries,
    newListName,
    newListType,
    editingListId,
    editingName,
    selectedListId,
    newListError,
    editingError,
    isLoading,
    setNewListType,
    handleChangeNewListName,
    handleCreateList,
    handleRenameList,
    handleDeleteList,
    handleStartEditing,
    handleChangeEditingName,
    handleCancelEditing,
    toggleSelectedList,
  };
}
