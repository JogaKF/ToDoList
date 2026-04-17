import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/common/ScreenContainer';
import { StateCard } from '../components/common/StateCard';
import { useAppDatabase } from '../db/sqlite';
import { itemsService } from '../features/items/service';
import type { Item } from '../features/items/types';
import { ui } from '../theme/ui';
import { formatDateLabel } from '../utils/date';

import type { RootStackParamList } from '../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'TaskPreview'>;
type PreviewRoute = RouteProp<RootStackParamList, 'TaskPreview'>;

function parseRecurrenceSummary(item: Item) {
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
      if (!item.recurrenceConfig) {
        return 'Niestandardowo';
      }

      try {
        const parsed = JSON.parse(item.recurrenceConfig) as { interval?: number; unit?: 'days' | 'weeks' | 'months' };
        const unitLabel =
          parsed.unit === 'days' ? 'dni' : parsed.unit === 'months' ? 'miesiace' : 'tygodnie';
        return `Co ${parsed.interval ?? 1} ${unitLabel}`;
      } catch {
        return 'Niestandardowo';
      }
    }
    default:
      return 'Jednorazowe';
  }
}

export function TaskPreviewScreen() {
  const db = useAppDatabase();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<PreviewRoute>();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    const nextItem = await itemsService.getById(db, route.params.itemId);
    setItem(nextItem ?? null);
    setIsLoading(false);
  }, [db, route.params.itemId]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.title ?? 'Podglad zadania',
    });
  }, [item?.title, navigation]);

  const dueDateLabel = useMemo(() => {
    if (!item?.dueDate) {
      return 'Brak terminu';
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? formatDateLabel(item.dueDate) : item.dueDate;
  }, [item?.dueDate]);

  return (
    <ScreenContainer>
      {isLoading ? (
        <StateCard
          title="Laduje zadanie"
          description="Pobieram pelny podglad zadania z lokalnej bazy danych."
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
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Szczegoly</Text>
            {item.type === 'shopping' ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ilosc</Text>
                <Text style={styles.detailValue}>
                  {item.quantity || item.unit
                    ? `${item.quantity ?? ''}${item.quantity && item.unit ? ' ' : ''}${item.unit ?? ''}`
                    : 'Bez ilosci i jednostki'}
                </Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Termin</Text>
              <Text style={styles.detailValue}>{dueDateLabel}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Powtarzanie</Text>
              <Text style={styles.detailValue}>{parseRecurrenceSummary(item)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Moj dzien</Text>
              <Text style={styles.detailValue}>{item.myDayDate ?? 'Poza Moim dniem'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notatka</Text>
            <Text style={styles.noteText}>{item.note?.trim() ? item.note : 'Brak notatki dla tego zadania.'}</Text>
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
    fontSize: 32,
    fontWeight: '800',
    color: ui.colors.text,
  },
  meta: {
    color: ui.colors.textMuted,
    fontSize: 14,
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
  noteText: {
    color: ui.colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
});
