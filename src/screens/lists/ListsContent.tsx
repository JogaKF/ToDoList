import { Pressable, Text, TextInput, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { IconButton } from '../../components/common/IconButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { TodoList, TodoListSummary } from '../../features/lists/types';
import { ui } from '../../theme/ui';
import { LIST_TYPE_OPTIONS, MAX_LIST_NAME_LENGTH } from './constants';
import { getListTypeLabel } from './helpers';
import { styles } from './styles';

type ListsContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  lists: TodoList[];
  summaries: Record<string, TodoListSummary>;
  newListName: string;
  newListType: TodoList['type'];
  editingListId: string | null;
  editingName: string;
  selectedListId: string | null;
  newListError: string | null;
  editingError: string | null;
  isLoading: boolean;
  onChangeNewListName: (value: string) => void;
  onChangeNewListType: (value: TodoList['type']) => void;
  onCreateList: () => void;
  onRenameList: (listId: string) => void;
  onDeleteList: (list: TodoList) => void;
  onStartEditing: (list: TodoList) => void;
  onChangeEditingName: (value: string) => void;
  onCancelEditing: () => void;
  onToggleSelectedList: (listId: string) => void;
  onOpenList: (listId: string) => void;
};

export function ListsContent({
  t,
  bottomInset,
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
  onChangeNewListName,
  onChangeNewListType,
  onCreateList,
  onRenameList,
  onDeleteList,
  onStartEditing,
  onChangeEditingName,
  onCancelEditing,
  onToggleSelectedList,
  onOpenList,
}: ListsContentProps) {
  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('lists_eyebrow')}</Text>
        <Text style={styles.title}>{t('lists_title')}</Text>
        <Text style={styles.subtitle}>{t('lists_intro')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('lists_create')}</Text>
        <TextInput
          placeholder="Np. Dom, Praca, Zakupy"
          placeholderTextColor={ui.colors.textSoft}
          value={newListName}
          onChangeText={onChangeNewListName}
          style={styles.input}
          maxLength={MAX_LIST_NAME_LENGTH}
          returnKeyType="done"
          onSubmitEditing={onCreateList}
        />
        <Text style={styles.inputHint}>{newListError ?? t('lists_name_hint')}</Text>
        <View style={styles.typeRow}>
          {LIST_TYPE_OPTIONS.map((type) => (
            <PrimaryButton
              key={type}
              label={type === 'tasks' ? t('lists_tasks') : t('lists_shopping')}
              onPress={() => onChangeNewListType(type)}
              tone={newListType === type ? 'primary' : 'muted'}
            />
          ))}
        </View>
        <PrimaryButton label={t('lists_create_button')} leadingIcon="+" disabled={!newListName.trim()} onPress={onCreateList} />
      </View>

      {isLoading ? <StateCard title={t('details_loading')} description={t('details_loading_hint')} /> : null}

      {!isLoading && lists.length === 0 ? <StateCard title={t('lists_empty')} description={t('lists_empty_hint')} /> : null}

      <View style={styles.listGroup}>
        {lists.map((list) => {
          const isEditing = editingListId === list.id;
          const isSelected = selectedListId === list.id;
          const summary = summaries[list.id];

          return (
            <Pressable
              key={list.id}
              onPress={() => onToggleSelectedList(list.id)}
              style={[styles.listCard, isSelected && styles.listCardSelected]}
            >
              {isEditing ? (
                <>
                  <TextInput
                    value={editingName}
                    onChangeText={onChangeEditingName}
                    style={styles.input}
                    placeholder="Nowa nazwa listy"
                    placeholderTextColor={ui.colors.textSoft}
                    autoFocus
                    maxLength={MAX_LIST_NAME_LENGTH}
                    returnKeyType="done"
                    onSubmitEditing={() => onRenameList(list.id)}
                  />
                  <Text style={styles.inputHintInline}>{editingError ?? 'Nowa nazwa zapisze sie od razu w lokalnej bazie.'}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listMeta}>{getListTypeLabel(list.type)}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.openItems ?? 0} otwarte</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.doneItems ?? 0} zrobione</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>{summary?.myDayItems ?? 0} w Moim dniu</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.actionsRow}>
                {isEditing ? (
                  <>
                    <IconButton icon="check" tone="primary" onPress={() => onRenameList(list.id)} />
                    <IconButton icon="close" onPress={onCancelEditing} />
                  </>
                ) : (
                  <>
                    <PrimaryButton label={t('lists_open')} leadingIcon="›" onPress={() => onOpenList(list.id)} />
                    {isSelected ? (
                      <View style={styles.iconCluster}>
                        <IconButton icon="pencil-outline" onPress={() => onStartEditing(list)} />
                        <IconButton icon="trash-can-outline" tone="danger" onPress={() => onDeleteList(list)} />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}
