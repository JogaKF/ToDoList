import { Text, TextInput, View } from 'react-native';

import { IconButton } from '../../components/common/IconButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { Item, ItemActivity, ItemRelations, RecurrenceUnit, SeriesEditScope } from '../../features/items/types';
import type { TodoList } from '../../features/lists/types';
import { ui } from '../../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../../utils/date';
import { recurrenceLabels, recurrenceOptions, shoppingQuickUnits } from './constants';
import { formatShoppingSummary, getRecurrenceSummary, isValidDateKey, type TaskEditorState } from './helpers';
import { styles } from './styles';

type TaskDetailsContentProps = {
  item: Item | null;
  sourceList: TodoList | null;
  relations: ItemRelations;
  activity: ItemActivity[];
  draft: TaskEditorState;
  isTask: boolean;
  isLoading: boolean;
  isSaving: boolean;
  saveMessage: string | null;
  errorMessage: string | null;
  saveScope: SeriesEditScope;
  customCategoryName: string;
  allShoppingCategoryNames: string[];
  isFavoriteShoppingItem: boolean;
  isRecurringOverdue: boolean;
  recurringPreview: string[];
  onChangeCustomCategoryName: (value: string) => void;
  onUpdateDraft: <Key extends keyof TaskEditorState>(key: Key, value: TaskEditorState[Key]) => void;
  onToggleShoppingFavorite: () => void;
  onToggleDone: () => void;
  onSetMyDayDate: (dateKey: string | null) => void;
  onRescheduleRecurring: (dateKey: string, scope: SeriesEditScope) => void;
  onSetSaveScope: (scope: SeriesEditScope) => void;
  onAddCustomCategory: () => void;
  onSave: () => void;
  onReset: () => void;
  onOpenSourceList: () => void;
  onOpenParent: (itemId: string) => void;
  onOpenChild: (itemId: string) => void;
};

export function TaskDetailsContent({
  item,
  sourceList,
  relations,
  activity,
  draft,
  isTask,
  isLoading,
  isSaving,
  saveMessage,
  errorMessage,
  saveScope,
  customCategoryName,
  allShoppingCategoryNames,
  isFavoriteShoppingItem,
  isRecurringOverdue,
  recurringPreview,
  onChangeCustomCategoryName,
  onUpdateDraft,
  onToggleShoppingFavorite,
  onToggleDone,
  onSetMyDayDate,
  onRescheduleRecurring,
  onSetSaveScope,
  onAddCustomCategory,
  onSave,
  onReset,
  onOpenSourceList,
  onOpenParent,
  onOpenChild,
}: TaskDetailsContentProps) {
  const dueDateLabel = !item?.dueDate ? 'Brak terminu' : isValidDateKey(item.dueDate) ? formatDateLabel(item.dueDate) : item.dueDate;
  const myDayLabel = !item?.myDayDate ? 'Poza Moim dniem' : isValidDateKey(item.myDayDate) ? formatDateLabel(item.myDayDate) : item.myDayDate;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Laduje zadanie</Text>
        <Text style={styles.meta}>Pobieram pelne szczegoly zadania z lokalnej bazy danych.</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nie znaleziono zadania</Text>
        <Text style={styles.meta}>To zadanie moglo zostac usuniete albo nie jest juz dostepne lokalnie.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          {item.type === 'shopping' ? (
            <IconButton
              icon="star"
              onPress={onToggleShoppingFavorite}
              active={isFavoriteShoppingItem}
              tone={isFavoriteShoppingItem ? 'primary' : 'muted'}
            />
          ) : null}
        </View>
        <Text style={styles.meta}>
          {item.status === 'done' ? 'Zrobione' : 'Otwarte'} | {item.type === 'shopping' ? 'Zakupy' : 'Task'}
        </Text>
        <Text style={styles.supportingMeta}>
          {item.type === 'shopping'
            ? formatShoppingSummary(item)
            : `${dueDateLabel} • ${getRecurrenceSummary(item)}${item.recurrenceIsException ? ' • Wyjatek serii' : ''}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Szybkie akcje</Text>
        <View style={styles.actionsWrap}>
          <PrimaryButton
            label={item.status === 'done' ? 'Cofnij ukonczenie' : 'Oznacz jako zrobione'}
            tone={item.status === 'done' ? 'muted' : 'primary'}
            onPress={onToggleDone}
          />
          {isTask ? (
            <>
              <PrimaryButton
                label={`Dzisiaj ${formatDateLabel(todayKey())}`}
                tone={item.myDayDate === todayKey() ? 'primary' : 'muted'}
                onPress={() => onSetMyDayDate(todayKey())}
              />
              <PrimaryButton
                label={`Jutro ${formatDateLabel(dateKeyWithOffset(1))}`}
                tone={item.myDayDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                onPress={() => onSetMyDayDate(dateKeyWithOffset(1))}
              />
              <PrimaryButton
                label="Usun z Mojego dnia"
                tone={!item.myDayDate ? 'muted' : 'danger'}
                onPress={() => onSetMyDayDate(null)}
              />
            </>
          ) : null}
        </View>
        {isRecurringOverdue ? (
          <View style={styles.overdueCard}>
            <Text style={styles.overdueTitle}>Zalegle wystapienie serii</Text>
            <Text style={styles.overdueText}>
              To zadanie cykliczne ma termin w przeszlosci. Mozesz przesunac tylko to wystapienie albo od razu cala serie.
            </Text>
            <View style={styles.actionsWrap}>
              <PrimaryButton label="To wystapienie na dzis" tone="muted" onPress={() => onRescheduleRecurring(todayKey(), 'single')} />
              <PrimaryButton
                label="To wystapienie na jutro"
                tone="muted"
                onPress={() => onRescheduleRecurring(dateKeyWithOffset(1), 'single')}
              />
              <PrimaryButton label="Cala seria na dzis" tone="primary" onPress={() => onRescheduleRecurring(todayKey(), 'series')} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Szczegoly zadania</Text>
        <Text style={styles.detailLabel}>Tytul</Text>
        <TextInput
          value={draft.title}
          onChangeText={(value) => onUpdateDraft('title', value)}
          style={styles.input}
          placeholder="Tytul zadania"
          placeholderTextColor={ui.colors.textSoft}
          maxLength={120}
        />

        {item.type === 'shopping' ? (
          <>
            <Text style={styles.detailLabel}>Kategoria</Text>
            <View style={styles.actionsWrap}>
              {allShoppingCategoryNames.map((category) => (
                <PrimaryButton
                  key={`details-category-${category}`}
                  label={category}
                  tone={draft.category === category ? 'primary' : 'muted'}
                  onPress={() => onUpdateDraft('category', draft.category === category ? '' : category)}
                />
              ))}
            </View>
            <View style={styles.row}>
              <View style={styles.fieldWrap}>
                <Text style={styles.detailLabel}>Nowa kategoria</Text>
                <TextInput
                  value={customCategoryName}
                  onChangeText={onChangeCustomCategoryName}
                  style={styles.input}
                  placeholder="Dodaj wlasna kategorie"
                  placeholderTextColor={ui.colors.textSoft}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.detailLabel}>Akcja</Text>
                <PrimaryButton label="Dodaj kategorie" tone="muted" onPress={onAddCustomCategory} disabled={!customCategoryName.trim()} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.fieldWrap}>
                <Text style={styles.detailLabel}>Kategoria</Text>
                <TextInput
                  value={draft.category}
                  onChangeText={(value) => onUpdateDraft('category', value)}
                  style={styles.input}
                  placeholder="Np. Nabial"
                  placeholderTextColor={ui.colors.textSoft}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.fieldWrap}>
                <Text style={styles.detailLabel}>Ilosc</Text>
                <TextInput
                  value={draft.quantity}
                  onChangeText={(value) => onUpdateDraft('quantity', value)}
                  style={styles.input}
                  placeholder="Np. 2"
                  placeholderTextColor={ui.colors.textSoft}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.detailLabel}>Jednostka</Text>
                <TextInput
                  value={draft.unit}
                  onChangeText={(value) => onUpdateDraft('unit', value)}
                  style={styles.input}
                  placeholder="Np. l"
                  placeholderTextColor={ui.colors.textSoft}
                />
              </View>
            </View>
            <View style={styles.actionsWrap}>
              {shoppingQuickUnits.map((unit) => (
                <PrimaryButton
                  key={`details-unit-${unit}`}
                  label={unit}
                  tone={draft.unit === unit ? 'primary' : 'muted'}
                  onPress={() => onUpdateDraft('unit', draft.unit === unit ? '' : unit)}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.detailLabel}>Notatka</Text>
            <TextInput
              value={draft.note}
              onChangeText={(value) => onUpdateDraft('note', value)}
              style={[styles.input, styles.noteInput]}
              placeholder="Notatka do zadania"
              placeholderTextColor={ui.colors.textSoft}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.detailLabel}>Termin</Text>
            <TextInput
              value={draft.dueDate}
              onChangeText={(value) => onUpdateDraft('dueDate', value)}
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={ui.colors.textSoft}
              autoCapitalize="none"
            />
            <View style={styles.actionsWrap}>
              <PrimaryButton label="Dzisiaj" tone={draft.dueDate === todayKey() ? 'primary' : 'muted'} onPress={() => onUpdateDraft('dueDate', todayKey())} />
              <PrimaryButton
                label="Jutro"
                tone={draft.dueDate === dateKeyWithOffset(1) ? 'primary' : 'muted'}
                onPress={() => onUpdateDraft('dueDate', dateKeyWithOffset(1))}
              />
              <PrimaryButton label="Bez daty" tone={!draft.dueDate ? 'primary' : 'muted'} onPress={() => onUpdateDraft('dueDate', '')} />
            </View>

            <Text style={styles.detailLabel}>Powtarzanie</Text>
            <View style={styles.actionsWrap}>
              {recurrenceOptions.map((option) => (
                <PrimaryButton
                  key={option}
                  label={recurrenceLabels[option]}
                  tone={draft.recurrenceType === option ? 'primary' : 'muted'}
                  onPress={() => onUpdateDraft('recurrenceType', option)}
                />
              ))}
            </View>

            {draft.recurrenceType === 'custom' ? (
              <View style={styles.row}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.detailLabel}>Interwal</Text>
                  <TextInput
                    value={draft.recurrenceInterval}
                    onChangeText={(value) => onUpdateDraft('recurrenceInterval', value.replace(/[^0-9]/g, ''))}
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
                        onPress={() => onUpdateDraft('recurrenceUnit', unit)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {(item.recurrenceType !== 'none' || draft.recurrenceType !== 'none') ? (
              <>
                <Text style={styles.detailLabel}>Zakres zapisu</Text>
                <View style={styles.actionsWrap}>
                  <PrimaryButton
                    label="Tylko to wystapienie"
                    tone={saveScope === 'single' ? 'primary' : 'muted'}
                    onPress={() => onSetSaveScope('single')}
                  />
                  <PrimaryButton
                    label="Cala seria"
                    tone={saveScope === 'series' ? 'primary' : 'muted'}
                    onPress={() => onSetSaveScope('series')}
                  />
                </View>
                <Text style={styles.scopeHint}>
                  {item.recurrenceIsException
                    ? 'To zadanie jest juz wyjatkiem w swojej serii.'
                    : 'Mozesz zmienic tylko to wystapienie albo od razu cala serie.'}
                </Text>
              </>
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
        {item.recurrenceType !== 'none' ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kolejne wystapienia</Text>
            <Text style={styles.detailValue}>
              {recurringPreview.length > 0
                ? recurringPreview.map((dateKey) => formatDateLabel(dateKey)).join(' • ')
                : 'Brak kolejnych wystapien'}
            </Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Moj dzien</Text>
          <Text style={styles.detailValue}>{myDayLabel}</Text>
        </View>
        {sourceList ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lista zrodlowa</Text>
            <View style={styles.inlineActions}>
              <Text style={styles.detailValue}>{sourceList.name}</Text>
              <PrimaryButton label="Otworz liste" tone="muted" onPress={onOpenSourceList} />
            </View>
          </View>
        ) : null}
        {relations.parent ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rodzic</Text>
            <View style={styles.relationBlock}>
              <Text style={styles.detailValue}>{relations.parent.title}</Text>
              <PrimaryButton label="Otworz rodzica" tone="muted" onPress={() => onOpenParent(relations.parent!.id)} />
            </View>
          </View>
        ) : null}
        {relations.children.length > 0 ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dzieci</Text>
            <View style={styles.relatedList}>
              {relations.children.map((child) => (
                <View key={child.id} style={styles.relatedCard}>
                  <View style={styles.taskContent}>
                    <Text style={styles.detailValue}>{child.title}</Text>
                    <Text style={styles.relatedMeta}>
                      {child.dueDate ? `Termin ${formatDateLabel(child.dueDate)}` : 'Bez terminu'}
                    </Text>
                  </View>
                  <PrimaryButton label="Otworz" tone="muted" onPress={() => onOpenChild(child.id)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Historia lokalna</Text>
          {activity.length === 0 ? (
            <Text style={styles.detailValue}>Brak zapisanych zmian lokalnych.</Text>
          ) : (
            <View style={styles.relatedList}>
              {activity.map((entry) => (
                <View key={entry.id} style={styles.historyCard}>
                  <Text style={styles.historyLabel}>{entry.label}</Text>
                  <Text style={styles.relatedMeta}>{new Date(entry.createdAt).toLocaleString('pl-PL')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.actionsWrap}>
          <PrimaryButton label={isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'} onPress={onSave} disabled={isSaving} />
          <PrimaryButton label="Cofnij lokalne zmiany" tone="muted" onPress={onReset} disabled={isSaving} />
        </View>
      </View>
    </>
  );
}
