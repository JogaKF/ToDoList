import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import { useAppDatabase } from '../../db/sqlite';
import { itemsService } from '../../features/items/service';
import type { PlannedTask } from '../../features/items/types';
import { addMonths, compareDateKeys, monthGrid, startOfMonth, todayKey } from '../../utils/date';
import type { PlannerMode } from './helpers';

export function usePlannerController() {
  const db = useAppDatabase();
  const { mutationTick, notifyMutation } = useRecovery();
  const [mode, setMode] = useState<PlannerMode>('due');
  const [monthCursor, setMonthCursor] = useState(startOfMonth(todayKey()));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [tasksWithoutDate, setTasksWithoutDate] = useState<PlannedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showWithoutDate, setShowWithoutDate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextPlannedTasks, nextWithoutDate] = await Promise.all([
      itemsService.getPlannedTasks(db, mode),
      itemsService.getTasksWithoutDate(db),
    ]);

    setPlannedTasks(nextPlannedTasks);
    setTasksWithoutDate(nextWithoutDate);
    setIsLoading(false);
  }, [db, mode]);

  useEffect(() => {
    void loadData();
  }, [loadData, mutationTick]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const monthDays = useMemo(() => monthGrid(monthCursor), [monthCursor]);
  const countsByDate = useMemo(() => {
    return plannedTasks.reduce<Record<string, number>>((accumulator, item) => {
      const key = item.plannedDate;
      if (!key) {
        return accumulator;
      }

      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [plannedTasks]);
  const selectedDayTasks = useMemo(
    () =>
      plannedTasks
        .filter((item) => item.plannedDate === selectedDate)
        .sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt)),
    [plannedTasks, selectedDate]
  );
  const overdueTasks = useMemo(
    () => plannedTasks.filter((item) => item.plannedDate && compareDateKeys(item.plannedDate, todayKey()) < 0),
    [plannedTasks]
  );
  const todayTasks = useMemo(() => plannedTasks.filter((item) => item.plannedDate === todayKey()), [plannedTasks]);
  const upcomingTasks = useMemo(
    () => plannedTasks.filter((item) => item.plannedDate && compareDateKeys(item.plannedDate, todayKey()) > 0),
    [plannedTasks]
  );

  const toggleTaskSelection = useCallback((itemId: string) => {
    setSelectedTaskIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  }, []);

  const handlePlanTask = useCallback(
    async (itemId: string, dateKey: string | null) => {
      await itemsService.updateDueDate(db, itemId, dateKey);
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation]
  );

  const handlePlanMany = useCallback(
    async (dateKey: string | null) => {
      await itemsService.updateDueDateMany(db, selectedTaskIds, dateKey);
      setSelectedTaskIds([]);
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation, selectedTaskIds]
  );

  const handleAddToMyDay = useCallback(
    async (itemId: string, dateKey: string) => {
      await itemsService.addToMyDay(db, itemId, dateKey);
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation]
  );

  const handleRemoveFromMyDay = useCallback(
    async (itemId: string) => {
      await itemsService.removeFromMyDay(db, itemId);
      notifyMutation();
      await loadData();
    },
    [db, loadData, notifyMutation]
  );

  const moveMonth = useCallback((offset: number) => {
    setMonthCursor((current) => addMonths(current, offset));
  }, []);

  return {
    mode,
    setMode,
    monthCursor,
    moveMonth,
    selectedDate,
    setSelectedDate,
    plannedTasks,
    tasksWithoutDate,
    selectedTaskIds,
    showWithoutDate,
    setShowWithoutDate,
    isLoading,
    monthDays,
    countsByDate,
    selectedDayTasks,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    handlePlanTask,
    handlePlanMany,
    handleAddToMyDay,
    handleRemoveFromMyDay,
    toggleTaskSelection,
  };
}
