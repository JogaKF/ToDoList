import { Pressable, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { IconButton } from '../../components/common/IconButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { ItemTreeNode } from '../../features/items/types';
import { ui } from '../../theme/ui';
import { dateKeyWithOffset, formatDateLabel, todayKey } from '../../utils/date';
import { formatShoppingAmount, formatShoppingSecondaryMeta, getRecurrenceSummary, isValidDateKey } from './helpers';
import { styles } from './styles';

type ListItemCardProps = {
  item: ItemTreeNode;
  isShoppingList: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  isFavoriteShoppingItem: boolean;
  childDraft: string;
  childDraftError: string;
  onRegisterSwipeable: (instance: Swipeable | null) => void;
  onSwipeAction: (direction: 'left' | 'right') => void;
  onSelect: () => void;
  onToggleExpanded: () => void;
  onToggleDone: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onIndent: () => void;
  onOutdent: () => void;
  onToggleMyDay: () => void;
  onSetMyDayDate: (dateKey: string) => void;
  onToggleFavorite: () => void;
  onOpenPreview: () => void;
  onDelete: () => void;
  onChangeChildDraft: (value: string) => void;
  onSubmitChild: () => void;
};

function SwipeAction({ direction, isShoppingList, item }: { direction: 'left' | 'right'; isShoppingList: boolean; item: ItemTreeNode }) {
  const isDelete = direction === 'right';

  if (!isDelete && isShoppingList) {
    return <View style={styles.swipeSpacer} />;
  }

  const label = isDelete ? 'Usun' : item.myDayDate ? 'Usun z dnia' : 'Dodaj do dnia';
  const containerStyle = isDelete ? styles.swipeDeleteAction : styles.swipeMyDayAction;
  const labelStyle = isDelete ? styles.swipeDeleteText : styles.swipeMyDayText;

  return (
    <View style={[styles.swipeAction, containerStyle]}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

export function ListItemCard({
  item,
  isShoppingList,
  isSelected,
  isExpanded,
  isFavoriteShoppingItem,
  childDraft,
  childDraftError,
  onRegisterSwipeable,
  onSwipeAction,
  onSelect,
  onToggleExpanded,
  onToggleDone,
  onMove,
  onIndent,
  onOutdent,
  onToggleMyDay,
  onSetMyDayDate,
  onToggleFavorite,
  onOpenPreview,
  onDelete,
  onChangeChildDraft,
  onSubmitChild,
}: ListItemCardProps) {
  const canShowChildren = !isShoppingList;
  const todayDateKey = todayKey();
  const tomorrowDateKey = dateKeyWithOffset(1);
  const isInMyDay = item.myDayDate === todayDateKey;

  const card = (
    <Pressable
      onPress={onSelect}
      style={[
        styles.itemCard,
        isSelected && styles.itemCardSelected,
        {
          marginLeft: canShowChildren ? item.depth * 12 : 0,
          borderLeftWidth: canShowChildren && item.depth > 0 ? 2 : 0,
          borderLeftColor: canShowChildren && item.depth > 0 ? '#1D4D69' : 'transparent',
        },
      ]}
    >
      <View style={styles.itemTopRow}>
        {canShowChildren && item.hasChildren ? (
          <Pressable onPress={onToggleExpanded} style={styles.treeToggle}>
            <Text style={styles.treeToggleText}>{isExpanded ? '⌄' : '›'}</Text>
          </Pressable>
        ) : (
          <View style={styles.treeSpacer} />
        )}

        <Pressable onPress={onToggleDone} style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}>
          <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
        </Pressable>

        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>{item.title}</Text>
          <Text style={styles.itemMeta}>
            {isShoppingList
              ? `${item.status === 'done' ? 'Kupione' : 'Do kupienia'}${
                  formatShoppingSecondaryMeta(item) ? ` • ${formatShoppingSecondaryMeta(item)}` : ''
                }`
              : isInMyDay
                ? `Moj dzien: ${item.myDayDate}`
                : 'Poza Moim dniem'}
          </Text>
          {item.dueDate ? (
            <Text style={styles.itemMeta}>
              Termin: {isValidDateKey(item.dueDate) ? formatDateLabel(item.dueDate) : item.dueDate}
            </Text>
          ) : null}
          {getRecurrenceSummary(item) ? <Text style={styles.itemMeta}>{getRecurrenceSummary(item)}</Text> : null}
          {item.note ? (
            <Text style={styles.itemNote} numberOfLines={2}>
              {item.note}
            </Text>
          ) : null}
          {!isShoppingList && item.parentId ? <Text style={styles.itemHint}>Subtask</Text> : null}
        </View>

        {isShoppingList && formatShoppingAmount(item) ? (
          <View style={styles.shoppingAmountBadge}>
            <Text style={styles.shoppingAmountText}>{formatShoppingAmount(item)}</Text>
          </View>
        ) : null}
      </View>

      {isSelected ? (
        <View style={styles.actionsRow}>
          <View style={styles.iconCluster}>
            <IconButton icon="arrow-up" onPress={() => onMove('up')} />
            <IconButton icon="arrow-down" onPress={() => onMove('down')} />
            {!isShoppingList ? (
              <>
                <IconButton icon="indent" onPress={onIndent} />
                <IconButton icon="outdent" onPress={onOutdent} disabled={!item.parentId} />
              </>
            ) : null}
            {!isShoppingList ? (
              <IconButton
                icon={isInMyDay ? 'weather-sunset-down' : 'weather-sunny'}
                onPress={onToggleMyDay}
                active={isInMyDay}
              />
            ) : null}
            {isShoppingList ? (
              <IconButton
                icon="star"
                onPress={onToggleFavorite}
                active={isFavoriteShoppingItem}
                tone={isFavoriteShoppingItem ? 'primary' : 'muted'}
              />
            ) : null}
            <IconButton icon="magnify" onPress={onOpenPreview} />
            <IconButton icon="pencil-outline" onPress={onOpenPreview} />
            <IconButton icon="trash-can-outline" tone="danger" onPress={onDelete} />
          </View>
          {!isShoppingList ? (
            <View style={styles.scheduleRow}>
              <PrimaryButton
                label={`Dzis ${formatDateLabel(todayDateKey)}`}
                tone={item.myDayDate === todayDateKey ? 'primary' : 'muted'}
                onPress={() => onSetMyDayDate(todayDateKey)}
              />
              <PrimaryButton
                label={`Jutro ${formatDateLabel(tomorrowDateKey)}`}
                tone={item.myDayDate === tomorrowDateKey ? 'primary' : 'muted'}
                onPress={() => onSetMyDayDate(tomorrowDateKey)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {canShowChildren ? (
        <View style={styles.childComposer}>
          {isSelected || childDraft.length > 0 ? (
            <>
              <TextInput
                value={childDraft}
                onChangeText={onChangeChildDraft}
                placeholder={item.parentId ? 'Dodaj kolejny poziom' : 'Dodaj subtask'}
                placeholderTextColor={ui.colors.textSoft}
                style={styles.input}
                maxLength={120}
                returnKeyType="done"
                onSubmitEditing={onSubmitChild}
              />
              <Text style={styles.inputHintInline}>
                {childDraftError ||
                  (item.parentId
                    ? 'Nowy poziom zapisze sie lokalnie pod tym elementem.'
                    : 'Subtask pojawi sie od razu pod wybranym taskiem.')}
              </Text>
              <View style={styles.subtaskActionsRow}>
                <PrimaryButton label={item.parentId ? 'Dodaj nizej' : 'Dodaj subtask'} leadingIcon="+" onPress={onSubmitChild} />
                {item.hasChildren ? (
                  <IconButton
                    icon={isExpanded ? 'unfold-less-horizontal' : 'unfold-more-horizontal'}
                    onPress={onToggleExpanded}
                  />
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <Swipeable
      ref={onRegisterSwipeable}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={72}
      rightThreshold={72}
      friction={2}
      renderLeftActions={!isShoppingList ? () => <SwipeAction direction="left" isShoppingList={isShoppingList} item={item} /> : undefined}
      renderRightActions={() => <SwipeAction direction="right" isShoppingList={isShoppingList} item={item} />}
      onSwipeableOpen={onSwipeAction}
    >
      {card}
    </Swipeable>
  );
}
