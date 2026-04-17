import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { Item, RecurrenceType, RecurrenceUnit } from '../features/items/types';
import { ui } from '../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../utils/date';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'TaskPreview'>;
type PreviewRoute = RouteProp<RootStackParamList, 'TaskPreview'>;
type TaskEditorState = {
  title: string;
  quantity: string;
  unit: string;
  note: string;
  dueDate: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: string;
  recurrenceUnit: RecurrenceUnit;
};

const recurrenceOptions: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'custom'];
const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'Jednorazowe',
  daily: 'Codziennie',
  weekly: 'Co tydzien',
  monthly: 'Co miesiac',
  weekdays: 'Dni robocze',
  custom: 'Niestandardowo',
};

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseRecurrenceConfig(raw: string | null) {
  if (!raw) {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }

  try {
    const parsed = JSON.parse(raw) as { interval?: number; unit?: RecurrenceUnit };
    return {
      interval: String(parsed.interval ?? 1),
      unit: parsed.unit ?? 'weeks',
    };
  } catch {
    return { interval: '1', unit: 'weeks' as RecurrenceUnit };
  }
}

function buildEditorState(item?: Item | null): TaskEditorState {
  const parsed = parseRecurrenceConfig(item?.recurrenceConfig ?? null);

  return {
    title: item?.title ?? '',
    quantity: item?.quantity ?? '',
    unit: item?.unit ?? '',
    note: item?.note ?? '',
    dueDate: item?.dueDate ?? '',
    recurrenceType: item?.recurrenceType ?? 'none',
    recurrenceInterval: parsed.interval,
    recurrenceUnit: parsed.unit,
  };
}

function getRecurrenceSummary(item: Item) {
  switch (item.recurrenceType) {
    case 'daily':
      return 'Codziennie';
    case 'weekly':
      return 'Co tydzien';
    case 'monthly':
      return 'Co miesiac';
    case 'weekdays':
      return 'Dni robocze';
    case 'custom': {
      const parsed = parseRecurrenceConfig(item.recurrenceConfig);
      const unitLabel =
        parsed.unit === 'days' ? 'dni' : parsed.unit === 'months' ? 'miesiace' : 'tygodnie';
      return `Co ${parsed.interval} ${unitLabel}`;
    }
    default:
      return 'Jednorazowe';
  }
}

function formatShoppingAmount(item: Pick<Item, 'quantity' | 'unit'>) {
  if (!item.quantity && !item.unit) {
    return 'Bez ilosci i jednostki';
  }

  return `${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`.trim();
}

export function TaskPreviewScreen() {
  const db = useAppDatabase();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<PreviewRoute>();
  const [item, setItem] = useState<Item | null>(null);
  const [draft, setDraft] = useState<TaskEditorState>(buildEditorState());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    const nextItem = await itemsService.getById(db, route.params.itemId);
    setItem(nextItem ?? null);
    setDraft(buildEditorState(nextItem ?? null));
    setIsLoading(false);
    setErrorMessage(null);
  }, [db, route.params.itemId]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  useFocusEffect(
    useCallback(() => {
      void loadItem();
    }, [loadItem])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.title ?? 'Szczegoly zadania',
    });
  }, [item?.title, navigation]);

  const dueDateLabel = useMemo(() => {
    if (!item?.dueDate) {
      return 'Brak terminu';
    }

    return isValidDateKey(item.dueDate) ? formatDateLabel(item.dueDate) : item.dueDate;
  }, [item?.dueDate]);

  const myDayLabel = useMemo(() => {
    if (!item?.myDayDate) {
      return 'Poza Moim dniem';
    }

    return isValidDateKey(item.myDayDate) ? formatDateLabel(item.myDayDate) : item.myDayDate;
  }, [item?.myDayDate]);

  const isTask = item?.type === 'task';

  const handleSave = useCallback(async () => {
    if (!item) {
      return;
    }

    const nextTitle = draft.title.trim();
    if (!nextTitle) {
      setErrorMessage('Tytul nie moze byc pusty.');
      setSaveMessage(null);
      return;
    }

    if (isTask && draft.dueDate.trim() && !isValidDateKey(draft.dueDate.trim())) {
      setErrorMessage('Data zadania musi miec format YYYY-MM-DD.');
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    await itemsService.updateDetails(db, item.id, {
      title: nextTitle,
      quantity: draft.quantity,
      unit: draft.unit,
      note: draft.note,
      dueDate: isTask ? draft.dueDate.trim() || null : null,
      recurrenceType: isTask ? draft.recurrenceType : 'none',
      recurrenceInterval: Number.parseInt(draft.recurrenceInterval, 10) || 1,
      recurrenceUnit: draft.recurrenceUnit,
    });
    await loadItem();
    setIsSaving(false);
    setErrorMessage(null);
    setSaveMessage('Zmiany zapisaly sie lokalnie.');
  }, [db, draft, isTask, item, loadItem]);

  const handleReset = useCallback(() => {
    setDraft(buildEditorState(item));
    setErrorMessage(null);
    setSaveMessage(null);
  }, [item]);

  const handleToggleDone = useCallback(async () => {
    if (!item) {
      return;
    }

    await itemsService.toggleDone(db, item);
    await loadItem();
    setSaveMessage(item.status === 'done' ? 'Zadanie wrocilo do aktywnych.' : 'Status zadania zostal zaktualizowany.');
  }, [db, item, loadItem]);

  const handleSetMyDayDate = useCallback(
    async (dateKey: string | null) => {
      if (!item) {
        return;
      }

      if (dateKey) {
        await itemsService.addToMyDay(db, item.id, dateKey);
      } else {
        await itemsService.removeFromMyDay(db, item.id);
      }

      await loadItem();
      setSaveMessage(dateKey ? 'Zadanie zostalo zaplanowane.' : 'Zadanie usunieto z Mojego dnia.');
    },
    [db, item, loadItem]
  );

  return (
    <ScreenContainer>
      {isLoading ? (
        <StateCard
          title="Laduje zadanie"
          description="Pobieram pelne szczegoly zadania z lokalnej bazy danych."
        />
      ) : null}

      {!isLoading && !item ? (
        <StateCard
          title="Nie znaleziono zadania"
          description="To zadanie moglo zostac usuniete albo nie jest juz dostepne lokalnie."
        />
      ) : null}

      {item ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.status === 'done' ? 'Zrobione' : 'Otwarte'} | {item.type === 'shopping' ? 'Zakupy' : 'Task'}
            </Text>
            <Text style={styles.supportingMeta}>
              {item.type === 'shopping'
                ? formatShoppingAmount(item)
                : `${dueDateLabel} • ${getRecurrenceSummary(item)}`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Szybkie akcje</Text>
            <View style={styles.actionsWrap}>
              <PrimaryButton
                label={item.status === 'done' ? 'Cofnij ukonczenie' : 'Oznacz jako zrobione'}
                tone={item.status === 'done' ? 'muted' : 'primary'}
                onPress={() => void handleToggleDone()}
              />
              {isTask ? (
                <>
                  <PrimaryButton
                    label={`Dzisiaj ${formatDateLabel(todayKey())}`}
                    tone={item.myDayDate === todayKey() ? 'primary' : 'muted'}
                    onPress={() => void handleSetMyDayDate(todayKey())}
                  />
                  <PrimaryButton
                    label={`Jutro ${formatDateLabel(dateKeyWithOffset(1))}`}
                    tone={item.myDayDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                    onPress={() => void handleSetMyDayDate(dateKeyWithOffset(1))}
                  />
                  <PrimaryButton
                    label="Usun z Mojego dnia"
                    tone={!item.myDayDate ? 'muted' : 'danger'}
                    onPress={() => void handleSetMyDayDate(null)}
                  />
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Szczegoly zadania</Text>
            <Text style={styles.detailLabel}>Tytul</Text>
            <TextInput
              value={draft.title}
              onChangeText={(value) => {
                setDraft((current) => ({
                  ...current,
                  title: value,
                }));
                if (value.trim()) {
                  setErrorMessage(null);
                }
              }}
              style={styles.input}
              placeholder="Tytul zadania"
              placeholderTextColor={ui.colors.textSoft}
              maxLength={120}
            />

            {item.type === 'shopping' ? (
              <View style={styles.row}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.detailLabel}>Ilosc</Text>
                  <TextInput
                    value={draft.quantity}
                    onChangeText={(value) =>
                      setDraft((current) => ({
                        ...current,
                        quantity: value,
                      }))
                    }
                    style={styles.input}
                    placeholder="Np. 2"
                    placeholderTextColor={ui.colors.textSoft}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.detailLabel}>Jednostka</Text>
                  <TextInput
                    value={draft.unit}
                    onChangeText={(value) =>
                      setDraft((current) => ({
                        ...current,
                        unit: value,
                      }))
                    }
                    style={styles.input}
                    placeholder="Np. l"
                    placeholderTextColor={ui.colors.textSoft}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.detailLabel}>Notatka</Text>
                <TextInput
                  value={draft.note}
                  onChangeText={(value) =>
                    setDraft((current) => ({
                      ...current,
                      note: value,
                    }))
                  }
                  style={[styles.input, styles.noteInput]}
                  placeholder="Notatka do zadania"
                  placeholderTextColor={ui.colors.textSoft}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.detailLabel}>Termin</Text>
                <TextInput
                  value={draft.dueDate}
                  onChangeText={(value) =>
                    setDraft((current) => ({
                      ...current,
                      dueDate: value,
                    }))
                  }
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={ui.colors.textSoft}
                  autoCapitalize="none"
                />
                <View style={styles.actionsWrap}>
                  <PrimaryButton
                    label="Dzisiaj"
                    tone={draft.dueDate === todayKey() ? 'primary' : 'muted'}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        dueDate: todayKey(),
                      }))
                    }
                  />
                  <PrimaryButton
                    label="Jutro"
                    tone={draft.dueDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        dueDate: dateKeyWithOffset(1),
                      }))
                    }
                  />
                  <PrimaryButton
                    label="Bez daty"
                    tone={!draft.dueDate ? 'primary' : 'muted'}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        dueDate: '',
                      }))
                    }
                  />
                </View>

                <Text style={styles.detailLabel}>Powtarzanie</Text>
                <View style={styles.actionsWrap}>
                  {recurrenceOptions.map((option) => (
                    <PrimaryButton
                      key={option}
                      label={recurrenceLabels[option]}
                      tone={draft.recurrenceType === option ? 'primary' : 'muted'}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          recurrenceType: option,
                        }))
                      }
                    />
                  ))}
                </View>

                {draft.recurrenceType === 'custom' ? (
                  <View style={styles.row}>
                    <View style={styles.fieldWrap}>
                      <Text style={styles.detailLabel}>Interwal</Text>
                      <TextInput
                        value={draft.recurrenceInterval}
                        onChangeText={(value) =>
                          setDraft((current) => ({
                            ...current,
                            recurrenceInterval: value.replace(/[^0-9]/g, ''),
                          }))
                        }
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor={ui.colors.textSoft}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.fieldWrapWide}>
                      <Text style={styles.detailLabel}>Jednostka</Text>
                      <View style={styles.actionsWrap}>
                        {(['days', 'weeks', 'months'] as RecurrenceUnit[]).map((unit) => (
                          <PrimaryButton
                            key={unit}
                            label={unit === 'days' ? 'Dni' : unit === 'weeks' ? 'Tygodnie' : 'Miesiace'}
                            tone={draft.recurrenceUnit === unit ? 'primary' : 'muted'}
                            onPress={() =>
                              setDraft((current) => ({
                                ...current,
                                recurrenceUnit: unit,
                              }))
                            }
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Stan lokalny</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Termin</Text>
              <Text style={styles.detailValue}>{dueDateLabel}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Powtarzanie</Text>
              <Text style={styles.detailValue}>{getRecurrenceSummary(item)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Moj dzien</Text>
              <Text style={styles.detailValue}>{myDayLabel}</Text>
            </View>
            {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <View style={styles.actionsWrap}>
              <PrimaryButton
                label={isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                onPress={() => void handleSave()}
                disabled={isSaving}
              />
              <PrimaryButton
                label="Cofnij lokalne zmiany"
                tone="muted"
                onPress={handleReset}
                disabled={isSaving}
              />
            </View>
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: ui.colors.text,
  },
  meta: {
    color: ui.colors.textMuted,
    fontSize: 14,
  },
  supportingMeta: {
    color: ui.colors.textSoft,
    fontSize: 13,
  },
  card: {
    backgroundColor: 'rgba(12, 27, 43, 0.78)',
    borderRadius: ui.radius.lg,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 56, 82, 0.35)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ui.colors.text,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: ui.colors.textSoft,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: ui.colors.text,
    fontSize: 15,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.input,
    color: ui.colors.text,
  },
  noteInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  fieldWrap: {
    flex: 1,
    gap: 8,
  },
  fieldWrapWide: {
    flex: 2,
    gap: 8,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  successText: {
    color: '#8BE3B0',
    fontSize: 13,
  },
  errorText: {
    color: '#FF8F8F',
    fontSize: 13,
  },
});
