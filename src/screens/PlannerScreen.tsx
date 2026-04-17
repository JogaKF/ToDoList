import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlannerStackParamList } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { PlannedTask } from '../features/items/types';
import { ui } from '../theme/ui';
import {
  addMonths,
  compareDateKeys,
  dateKeyWithOffset,
  formatDateLabel,
  formatMonthLabel,
  monthGrid,
  startOfMonth,
  todayKey,
} from '../utils/date';

type Navigation = NativeStackNavigationProp<PlannerStackParamList, 'PlannerHome'>;
type PlannerMode = 'due' | 'myday';

function sectionTitleFor(mode: PlannerMode, dateKey: string) {
  return mode === 'due' ? `Termin: ${formatDateLabel(dateKey)}` : `Moj dzien: ${formatDateLabel(dateKey)}`;
}

function formatTaskMeta(item: PlannedTask, mode: PlannerMode) {
  const parts = [item.listName];

  if (mode === 'due' && item.myDayDate) {
    parts.push(`Moj dzien ${formatDateLabel(item.myDayDate)}`);
  }

  if (mode === 'myday' && item.dueDate) {
    parts.push(`Termin ${formatDateLabel(item.dueDate)}`);
  }

  if (item.recurrenceType !== 'none') {
    parts.push('Powtarzalne');
  }

  return parts.join(' • ');
}

export function PlannerScreen() {
  const db = useAppDatabase();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const t = useI18n();
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
  }, [loadData]);

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
  const todayTasks = useMemo(
    () => plannedTasks.filter((item) => item.plannedDate === todayKey()),
    [plannedTasks]
  );
  const upcomingTasks = useMemo(
    () => plannedTasks.filter((item) => item.plannedDate && compareDateKeys(item.plannedDate, todayKey()) > 0),
    [plannedTasks]
  );

  const selectedWithoutDateTasks = useMemo(
    () => tasksWithoutDate.filter((item) => selectedTaskIds.includes(item.id)),
    [selectedTaskIds, tasksWithoutDate]
  );

  const handlePlanTask = useCallback(
    async (itemId: string, dateKey: string | null) => {
      await itemsService.updateDueDate(db, itemId, dateKey);
      await loadData();
    },
    [db, loadData]
  );

  const handlePlanMany = useCallback(
    async (dateKey: string | null) => {
      await itemsService.updateDueDateMany(db, selectedTaskIds, dateKey);
      setSelectedTaskIds([]);
      await loadData();
    },
    [db, loadData, selectedTaskIds]
  );

  const renderPlannedTask = useCallback(
    (item: PlannedTask, compact = false) => (
      <View key={item.id} style={[styles.taskCard, compact && styles.taskCardCompact]}>
        <View style={styles.taskContent}>
          <Pressable onPress={() => navigation.navigate('TaskPreview', { itemId: item.id })}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskMeta}>{formatTaskMeta(item, mode)}</Text>
          </Pressable>
        </View>
        {!compact ? (
          <View style={styles.taskActions}>
            {mode === 'due' ? (
              <>
                <PrimaryButton label="Dzis" tone="muted" onPress={() => void handlePlanTask(item.id, todayKey())} />
                <PrimaryButton label="Jutro" tone="muted" onPress={() => void handlePlanTask(item.id, dateKeyWithOffset(1))} />
                <PrimaryButton label="Na wybrany dzien" tone="primary" onPress={() => void handlePlanTask(item.id, selectedDate)} />
                <PrimaryButton label="Bez daty" tone="muted" onPress={() => void handlePlanTask(item.id, null)} />
              </>
            ) : (
              <>
                <PrimaryButton label="Dzis" tone="muted" onPress={() => void itemsService.addToMyDay(db, item.id, todayKey()).then(loadData)} />
                <PrimaryButton label="Jutro" tone="muted" onPress={() => void itemsService.addToMyDay(db, item.id, dateKeyWithOffset(1)).then(loadData)} />
                <PrimaryButton label="Na wybrany dzien" tone="primary" onPress={() => void itemsService.addToMyDay(db, item.id, selectedDate).then(loadData)} />
                <PrimaryButton label="Usun z dnia" tone="muted" onPress={() => void itemsService.removeFromMyDay(db, item.id).then(loadData)} />
              </>
            )}
          </View>
        ) : null}
      </View>
    ),
    [db, handlePlanTask, loadData, mode, navigation, selectedDate]
  );

  return (
    <ScreenContainer bottomInset={tabBarHeight + 16}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('planner_eyebrow')}</Text>
        <Text style={styles.title}>{t('planner_title')}</Text>
        <Text style={styles.subtitle}>{t('planner_intro')}</Text>
      </View>

      <View style={styles.toolbar}>
        <PrimaryButton label="Terminy" tone={mode === 'due' ? 'primary' : 'muted'} onPress={() => setMode('due')} />
        <PrimaryButton label="Moj dzien" tone={mode === 'myday' ? 'primary' : 'muted'} onPress={() => setMode('myday')} />
        <PrimaryButton label="Poprzedni miesiac" tone="muted" onPress={() => setMonthCursor(addMonths(monthCursor, -1))} />
        <PrimaryButton label="Nastepny miesiac" tone="muted" onPress={() => setMonthCursor(addMonths(monthCursor, 1))} />
      </View>

      <View style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>{formatMonthLabel(monthCursor)}</Text>
        <View style={styles.weekdaysRow}>
          {['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'Sb', 'Nd'].map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {monthDays.map((day) => {
            const isCurrentMonth = day.slice(0, 7) === monthCursor.slice(0, 7);
            const isSelected = day === selectedDate;
            const count = countsByDate[day] ?? 0;

            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDate(day)}
                style={[styles.dayCell, isSelected && styles.dayCellSelected, !isCurrentMonth && styles.dayCellMuted]}
              >
                <Text style={[styles.dayNumber, !isCurrentMonth && styles.dayNumberMuted]}>{day.slice(-2)}</Text>
                {count > 0 ? <View style={styles.dayBadge}><Text style={styles.dayBadgeText}>{count}</Text></View> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <StateCard title="Laduje planner" description="Zbieram zaplanowane zadania i buduje miesieczny widok z lokalnej bazy." />
      ) : null}

      {!isLoading ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Przeglad</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}><Text style={styles.summaryText}>{overdueTasks.length} zalegle</Text></View>
              <View style={styles.summaryPill}><Text style={styles.summaryText}>{todayTasks.length} dzis</Text></View>
              <View style={styles.summaryPill}><Text style={styles.summaryText}>{upcomingTasks.length} nadchodzace</Text></View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{sectionTitleFor(mode, selectedDate)}</Text>
            {selectedDayTasks.length === 0 ? (
              <StateCard title="Brak zadan na ten dzien" description="Wybierz inny dzien albo przypisz zadania z sekcji bez daty." />
            ) : (
              <View style={styles.taskList}>{selectedDayTasks.map((item) => renderPlannedTask(item))}</View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Zalegle</Text>
            {overdueTasks.length === 0 ? (
              <Text style={styles.emptyInline}>Brak zaleglych zadan.</Text>
            ) : (
              <View style={styles.taskList}>{overdueTasks.slice(0, 5).map((item) => renderPlannedTask(item, true))}</View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nadchodzace</Text>
            {upcomingTasks.length === 0 ? (
              <Text style={styles.emptyInline}>Brak nadchodzacych zadan.</Text>
            ) : (
              <View style={styles.taskList}>{upcomingTasks.slice(0, 5).map((item) => renderPlannedTask(item, true))}</View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Bez daty</Text>
              <PrimaryButton
                label={showWithoutDate ? 'Ukryj' : 'Pokaz'}
                tone="muted"
                onPress={() => setShowWithoutDate((current) => !current)}
              />
            </View>
            {showWithoutDate ? (
              <>
                <Text style={styles.sectionHint}>Zaznacz kilka zadan i przypisz je hurtowo do dzis, jutra albo wybranego dnia z kalendarza.</Text>
                <View style={styles.bulkActions}>
                  <PrimaryButton label="Na dzis" tone="muted" disabled={selectedTaskIds.length === 0} onPress={() => void handlePlanMany(todayKey())} />
                  <PrimaryButton label="Na jutro" tone="muted" disabled={selectedTaskIds.length === 0} onPress={() => void handlePlanMany(dateKeyWithOffset(1))} />
                  <PrimaryButton label="Na wybrany dzien" tone="primary" disabled={selectedTaskIds.length === 0} onPress={() => void handlePlanMany(selectedDate)} />
                </View>
                {tasksWithoutDate.length === 0 ? (
                  <Text style={styles.emptyInline}>Wszystkie taski maja juz zaplanowany termin.</Text>
                ) : (
                  <View style={styles.taskList}>
                    {tasksWithoutDate.map((item) => {
                      const isSelected = selectedTaskIds.includes(item.id);

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            setSelectedTaskIds((current) =>
                              current.includes(item.id)
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id]
                            )
                          }
                          style={[styles.unscheduledCard, isSelected && styles.unscheduledCardSelected]}
                        >
                          <View style={styles.checkboxMini}>
                            <Text style={styles.checkboxMiniText}>{isSelected ? '✓' : ''}</Text>
                          </View>
                          <View style={styles.taskContent}>
                            <Text style={styles.taskTitle}>{item.title}</Text>
                            <Text style={styles.taskMeta}>{item.listName}</Text>
                          </View>
                          <PrimaryButton label="Otworz" tone="muted" onPress={() => navigation.navigate('TaskPreview', { itemId: item.id })} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            ) : null}
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 8,
  },
  eyebrow: {
    color: ui.colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: ui.colors.text,
  },
  subtitle: {
    color: ui.colors.textMuted,
    lineHeight: 22,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  sectionCard: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  summaryCard: {
    backgroundColor: 'rgba(16, 39, 65, 0.84)',
    borderRadius: ui.radius.lg,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2C6D96',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: ui.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: '13.2%',
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
    backgroundColor: 'rgba(10, 20, 32, 0.72)',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayCellSelected: {
    borderColor: '#2C6D96',
    backgroundColor: '#143048',
  },
  dayCellMuted: {
    opacity: 0.5,
  },
  dayNumber: {
    color: ui.colors.text,
    fontWeight: '700',
  },
  dayNumberMuted: {
    color: ui.colors.textMuted,
  },
  dayBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ui.colors.primaryStrong,
    alignItems: 'center',
  },
  dayBadgeText: {
    color: '#041018',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 48, 72, 0.85)',
  },
  summaryText: {
    color: ui.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  taskCardCompact: {
    paddingVertical: 12,
  },
  taskContent: {
    gap: 4,
    flex: 1,
  },
  taskTitle: {
    color: ui.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  taskMeta: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionHint: {
    color: ui.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  bulkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unscheduledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 18, 29, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.28)',
  },
  unscheduledCardSelected: {
    borderColor: '#2C6D96',
    backgroundColor: '#143048',
  },
  checkboxMini: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMiniText: {
    color: '#041018',
    fontWeight: '800',
  },
  emptyInline: {
    color: ui.colors.textMuted,
    fontSize: 13,
  },
});
