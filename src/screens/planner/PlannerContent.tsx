import { Pressable, Text, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { PlannedTask } from '../../features/items/types';
import { dateKeyWithOffset, formatMonthLabel, todayKey } from '../../utils/date';
import { PLANNER_MODES, PLANNER_WEEKDAYS } from './constants';
import { formatTaskMeta, sectionTitleFor, type PlannerMode } from './helpers';
import { styles } from './styles';

type PlannerContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  mode: PlannerMode;
  monthCursor: string;
  selectedDate: string;
  selectedTaskIds: string[];
  showWithoutDate: boolean;
  isLoading: boolean;
  monthDays: string[];
  countsByDate: Record<string, number>;
  selectedDayTasks: PlannedTask[];
  overdueTasks: PlannedTask[];
  todayTasks: PlannedTask[];
  upcomingTasks: PlannedTask[];
  tasksWithoutDate: PlannedTask[];
  onChangeMode: (mode: PlannerMode) => void;
  onMoveMonth: (offset: number) => void;
  onSelectDate: (dateKey: string) => void;
  onToggleWithoutDate: () => void;
  onToggleTaskSelection: (itemId: string) => void;
  onPlanTask: (itemId: string, dateKey: string | null) => void;
  onPlanMany: (dateKey: string | null) => void;
  onAddToMyDay: (itemId: string, dateKey: string) => void;
  onRemoveFromMyDay: (itemId: string) => void;
  onOpenPreview: (itemId: string) => void;
};

export function PlannerContent({
  t,
  bottomInset,
  mode,
  monthCursor,
  selectedDate,
  selectedTaskIds,
  showWithoutDate,
  isLoading,
  monthDays,
  countsByDate,
  selectedDayTasks,
  overdueTasks,
  todayTasks,
  upcomingTasks,
  tasksWithoutDate,
  onChangeMode,
  onMoveMonth,
  onSelectDate,
  onToggleWithoutDate,
  onToggleTaskSelection,
  onPlanTask,
  onPlanMany,
  onAddToMyDay,
  onRemoveFromMyDay,
  onOpenPreview,
}: PlannerContentProps) {
  const renderPlannedTask = (item: PlannedTask, compact = false) => (
    <View key={item.id} style={[styles.taskCard, compact && styles.taskCardCompact]}>
      <View style={styles.taskContent}>
        <Pressable onPress={() => onOpenPreview(item.id)}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskMeta}>{formatTaskMeta(item, mode)}</Text>
        </Pressable>
      </View>
      {!compact ? (
        <View style={styles.taskActions}>
          {mode === 'due' ? (
            <>
              <PrimaryButton label="Dzis" tone="muted" onPress={() => onPlanTask(item.id, todayKey())} />
              <PrimaryButton label="Jutro" tone="muted" onPress={() => onPlanTask(item.id, dateKeyWithOffset(1))} />
              <PrimaryButton label="Na wybrany dzien" tone="primary" onPress={() => onPlanTask(item.id, selectedDate)} />
              <PrimaryButton label="Bez daty" tone="muted" onPress={() => onPlanTask(item.id, null)} />
            </>
          ) : (
            <>
              <PrimaryButton label="Dzis" tone="muted" onPress={() => onAddToMyDay(item.id, todayKey())} />
              <PrimaryButton label="Jutro" tone="muted" onPress={() => onAddToMyDay(item.id, dateKeyWithOffset(1))} />
              <PrimaryButton label="Na wybrany dzien" tone="primary" onPress={() => onAddToMyDay(item.id, selectedDate)} />
              <PrimaryButton label="Usun z dnia" tone="muted" onPress={() => onRemoveFromMyDay(item.id)} />
            </>
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('planner_eyebrow')}</Text>
        <Text style={styles.title}>{t('planner_title')}</Text>
        <Text style={styles.subtitle}>{t('planner_intro')}</Text>
      </View>

      <View style={styles.toolbar}>
        {PLANNER_MODES.map((plannerMode) => (
          <PrimaryButton
            key={plannerMode}
            label={plannerMode === 'due' ? 'Terminy' : 'Moj dzien'}
            tone={mode === plannerMode ? 'primary' : 'muted'}
            onPress={() => onChangeMode(plannerMode)}
          />
        ))}
        <PrimaryButton label="Poprzedni miesiac" tone="muted" onPress={() => onMoveMonth(-1)} />
        <PrimaryButton label="Nastepny miesiac" tone="muted" onPress={() => onMoveMonth(1)} />
      </View>

      <View style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>{formatMonthLabel(monthCursor)}</Text>
        <View style={styles.weekdaysRow}>
          {PLANNER_WEEKDAYS.map((weekday) => (
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
                onPress={() => onSelectDate(day)}
                style={[styles.dayCell, isSelected && styles.dayCellSelected, !isCurrentMonth && styles.dayCellMuted]}
              >
                <Text style={[styles.dayNumber, !isCurrentMonth && styles.dayNumberMuted]}>{day.slice(-2)}</Text>
                {count > 0 ? (
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? <StateCard title="Laduje planner" description="Zbieram zaplanowane zadania i buduje miesieczny widok z lokalnej bazy." /> : null}

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
              <PrimaryButton label={showWithoutDate ? 'Ukryj' : 'Pokaz'} tone="muted" onPress={onToggleWithoutDate} />
            </View>
            {showWithoutDate ? (
              <>
                <Text style={styles.sectionHint}>Zaznacz kilka zadan i przypisz je hurtowo do dzis, jutra albo wybranego dnia z kalendarza.</Text>
                <View style={styles.bulkActions}>
                  <PrimaryButton label="Na dzis" tone="muted" disabled={selectedTaskIds.length === 0} onPress={() => onPlanMany(todayKey())} />
                  <PrimaryButton label="Na jutro" tone="muted" disabled={selectedTaskIds.length === 0} onPress={() => onPlanMany(dateKeyWithOffset(1))} />
                  <PrimaryButton label="Na wybrany dzien" tone="primary" disabled={selectedTaskIds.length === 0} onPress={() => onPlanMany(selectedDate)} />
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
                          onPress={() => onToggleTaskSelection(item.id)}
                          style={[styles.unscheduledCard, isSelected && styles.unscheduledCardSelected]}
                        >
                          <View style={styles.checkboxMini}>
                            <Text style={styles.checkboxMiniText}>{isSelected ? '✓' : ''}</Text>
                          </View>
                          <View style={styles.taskContent}>
                            <Text style={styles.taskTitle}>{item.title}</Text>
                            <Text style={styles.taskMeta}>{item.listName}</Text>
                          </View>
                          <PrimaryButton label="Otworz" tone="muted" onPress={() => onOpenPreview(item.id)} />
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
