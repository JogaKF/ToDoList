import { Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { IconButton } from '../../components/common/IconButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import { flattenVisibleTree } from '../../features/items/tree';
import type { ItemTreeNode } from '../../features/items/types';
import { dateKeyWithOffset, formatDateLabel } from '../../utils/date';
import { MY_DAY_DATE_OFFSETS } from './constants';
import type { GroupedItems } from './helpers';
import { styles } from './styles';

type MyDayContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  groupedItems: GroupedItems[];
  expandedIds: Record<string, boolean>;
  showCompleted: boolean;
  selectedDate: string;
  isLoading: boolean;
  onSelectDate: (dateKey: string) => void;
  onToggleExpanded: (itemId: string) => void;
  onToggleDone: (item: ItemTreeNode) => void;
  onRemoveFromDay: (itemId: string) => void;
  onMoveToDay: (itemId: string, dateKey: string) => void;
  onRegisterSwipeable: (itemId: string, instance: Swipeable | null) => void;
  onOpenPreview: (itemId: string) => void;
};

export function MyDayContent({
  t,
  bottomInset,
  groupedItems,
  expandedIds,
  showCompleted,
  selectedDate,
  isLoading,
  onSelectDate,
  onToggleExpanded,
  onToggleDone,
  onRemoveFromDay,
  onMoveToDay,
  onRegisterSwipeable,
  onOpenPreview,
}: MyDayContentProps) {
  const renderSwipeLeftAction = () => (
    <View style={styles.swipeRemoveAction}>
      <Text style={styles.swipeRemoveText}>Usun z dnia</Text>
    </View>
  );

  const renderDayItem = (item: ItemTreeNode) => (
    <Swipeable
      key={item.id}
      ref={(instance) => onRegisterSwipeable(item.id, instance)}
      overshootLeft={false}
      overshootRight={false}
      rightThreshold={72}
      friction={2}
      renderRightActions={renderSwipeLeftAction}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          onRemoveFromDay(item.id);
        }
      }}
    >
      <View
        style={[
          styles.itemCard,
          {
            marginLeft: item.depth * 12,
            borderLeftWidth: item.depth > 0 ? 2 : 0,
            borderLeftColor: item.depth > 0 ? 'rgba(29, 77, 105, 0.65)' : 'transparent',
          },
        ]}
      >
        <View style={styles.itemRow}>
          {item.hasChildren ? (
            <Pressable onPress={() => onToggleExpanded(item.id)} style={styles.treeToggle}>
              <Text style={styles.treeToggleText}>{expandedIds[item.id] ? '⌄' : '›'}</Text>
            </Pressable>
          ) : (
            <View style={styles.treeSpacer} />
          )}
          <Pressable onPress={() => onToggleDone(item)} style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}>
            <Text style={styles.checkboxLabel}>{item.status === 'done' ? '✓' : ''}</Text>
          </Pressable>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, item.status === 'done' && styles.itemDone]}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.parentId ? 'Subtask' : 'Glowny task'} | {item.status}</Text>
          </View>
          <IconButton icon="magnify" onPress={() => onOpenPreview(item.id)} />
          {item.status === 'done' ? (
            <IconButton icon="weather-sunny" onPress={() => onMoveToDay(item.id, dateKeyWithOffset(1))} />
          ) : null}
          <IconButton icon="weather-sunset-down" tone="danger" onPress={() => onRemoveFromDay(item.id)} />
        </View>
      </View>
    </Swipeable>
  );

  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('my_day_eyebrow')}</Text>
        <Text style={styles.title}>{t('my_day_title')}</Text>
        <Text style={styles.subtitle}>
          {t('my_day_intro')} {formatDateLabel(selectedDate)}.
        </Text>
      </View>

      <View style={styles.daySwitcher}>
        {MY_DAY_DATE_OFFSETS.map((offset) => {
          const dateKey = dateKeyWithOffset(offset);
          const label = offset === -1 ? 'Wczoraj' : offset === 0 ? 'Dzis' : 'Jutro';
          return (
            <PrimaryButton
              key={dateKey}
              label={`${label} ${formatDateLabel(dateKey)}`}
              tone={selectedDate === dateKey ? 'primary' : 'muted'}
              onPress={() => onSelectDate(dateKey)}
            />
          );
        })}
      </View>

      {isLoading ? <StateCard title={t('my_day_loading')} description={t('my_day_loading_hint')} /> : null}

      {!isLoading && groupedItems.length === 0 ? <StateCard title={t('my_day_empty')} description={t('my_day_empty_hint')} /> : null}

      {groupedItems.map((group) => {
        const visibleItems = flattenVisibleTree(group.tree, expandedIds);
        const openItems = visibleItems.filter((item) => item.status === 'todo');
        const doneItems = visibleItems.filter((item) => item.status === 'done');

        return (
          <View key={group.list?.id ?? 'unknown'} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{group.list?.name ?? 'Nieznana lista'}</Text>
            {openItems.map(renderDayItem)}
            {showCompleted && doneItems.length > 0 ? (
              <View style={styles.doneSection}>
                <Text style={styles.doneSectionTitle}>Ukonczone</Text>
                {doneItems.map(renderDayItem)}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScreenContainer>
  );
}
