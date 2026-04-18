import { useLayoutEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ListsStackParamList } from '../app/navigation/types';
import { useI18n } from '../app/providers/PreferencesProvider';
import { ListDetailsContent } from './list-details/ListDetailsContent';
import { ListItemCard } from './list-details/ListItemCard';
import type { ShoppingGroup } from './list-details/helpers';
import { styles } from './list-details/styles';
import { useListDetailsController } from './list-details/useListDetailsController';

type Navigation = NativeStackNavigationProp<ListsStackParamList, 'ListDetails'>;
type DetailsRoute = RouteProp<ListsStackParamList, 'ListDetails'>;

export function ListDetailsScreen() {
  const t = useI18n();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<DetailsRoute>();
  const controller = useListDetailsController({
    listId: route.params.listId,
    navigateToList: (listId) => navigation.navigate('ListDetails', { listId }),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: controller.list?.name ?? 'Lista',
    });
  }, [controller.list?.name, navigation]);

  const renderItemById = (itemId: string) => {
    const item = controller.visibleItems.find((entry) => entry.id === itemId);
    if (!item) {
      return null;
    }

    const isFavoriteShoppingItem = controller.isShoppingList
      ? controller.isFavoriteShoppingEntry({
          title: item.title,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
        })
      : false;

    return (
      <ListItemCard
        key={item.id}
        item={item}
        isShoppingList={controller.isShoppingList}
        isSelected={controller.selectedItemId === item.id}
        isExpanded={Boolean(controller.expandedIds[item.id])}
        isFavoriteShoppingItem={isFavoriteShoppingItem}
        childDraft={controller.draftChildren[item.id] ?? ''}
        childDraftError={controller.draftErrors[item.id] ?? ''}
        onRegisterSwipeable={(instance) => controller.registerSwipeable(item.id, instance)}
        onSwipeAction={(direction) => controller.handleSwipeAction(item, direction)}
        onSelect={() => controller.toggleSelectedItem(item.id)}
        onToggleExpanded={() => controller.toggleExpanded(item.id)}
        onToggleDone={() => void controller.handleToggleDone(item)}
        onMove={(direction) => void controller.handleMoveItem(item, direction)}
        onIndent={() => void controller.handleIndentItem(item)}
        onOutdent={() => void controller.handleOutdentItem(item)}
        onToggleMyDay={() => void controller.handleToggleMyDay(item)}
        onSetMyDayDate={(dateKey) => void controller.handleSetMyDayDate(item, dateKey)}
        onToggleFavorite={() =>
          void controller.handleToggleFavorite({
            title: item.title,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
          })
        }
        onOpenPreview={() => navigation.navigate('TaskPreview', { itemId: item.id })}
        onDelete={() => controller.confirmDelete(item)}
        onChangeChildDraft={(value) => controller.handleChangeChildDraft(item.id, value)}
        onSubmitChild={() => void controller.handleCreateChildTask(item.id)}
      />
    );
  };

  const renderShoppingGroups = (groups: ShoppingGroup[]) =>
    groups.map((group) => renderShoppingGroupsSection(group, renderItemById));

  return (
    <ListDetailsContent
      t={t}
      bottomInset={tabBarHeight + 16}
      listName={controller.list?.name ?? 'Lista'}
      isShoppingList={controller.isShoppingList}
      listSummary={controller.listSummary}
      isLoading={controller.isLoading}
      visibleItemsCount={controller.visibleItems.length}
      newTaskTitle={controller.newTaskTitle}
      newTaskError={controller.newTaskError}
      composerCategory={controller.composerCategory}
      composerQuantity={controller.composerQuantity}
      composerUnit={controller.composerUnit}
      composerNote={controller.composerNote}
      composerDueDate={controller.composerDueDate}
      composerRecurrenceType={controller.composerRecurrenceType}
      composerRecurrenceInterval={controller.composerRecurrenceInterval}
      composerRecurrenceUnit={controller.composerRecurrenceUnit}
      showComposerDetails={controller.showComposerDetails}
      showShoppingDetails={controller.showShoppingDetails}
      showShoppingFavorites={controller.showShoppingFavorites}
      showShoppingHistory={controller.showShoppingHistory}
      showShoppingCategories={controller.showShoppingCategories}
      customCategoryName={controller.customCategoryName}
      allShoppingCategoryNames={controller.allShoppingCategoryNames}
      shoppingSuggestions={controller.shoppingSuggestions}
      shoppingFavorites={controller.shoppingFavorites}
      shoppingHistory={controller.shoppingHistory}
      selectedBrowseCategory={controller.selectedBrowseCategory}
      browseCategoryTemplates={controller.browseCategoryTemplates}
      expandableIds={controller.expandableIds}
      shoppingSortMode={controller.shoppingSortMode}
      shoppingGroupMode={controller.shoppingGroupMode}
      shoppingDoneItemsCount={controller.shoppingDoneItems.length}
      taskOpenItems={controller.taskOpenItems.map((item) => renderItemById(item.id))}
      taskDoneItems={controller.taskDoneItems.map((item) => renderItemById(item.id))}
      shoppingOpenGroups={controller.shoppingOpenGroups}
      shoppingDoneGroups={controller.shoppingDoneGroups}
      showCompleted={controller.showCompleted}
      onChangeNewTaskTitle={controller.handleChangeNewTaskTitle}
      onSubmitRootTask={() => void controller.handleCreateRootTask()}
      onChangeComposerCategory={controller.setComposerCategory}
      onChangeComposerQuantity={controller.setComposerQuantity}
      onChangeComposerUnit={controller.setComposerUnit}
      onChangeComposerNote={controller.setComposerNote}
      onChangeComposerDueDate={controller.setComposerDueDate}
      onChangeComposerRecurrenceType={controller.setComposerRecurrenceType}
      onChangeComposerRecurrenceInterval={(value) => controller.setComposerRecurrenceInterval(value.replace(/[^0-9]/g, ''))}
      onChangeComposerRecurrenceUnit={controller.setComposerRecurrenceUnit}
      onToggleComposerDetails={() => controller.setShowComposerDetails((current) => !current)}
      onToggleShoppingDetails={() => controller.setShowShoppingDetails((current) => !current)}
      onToggleShoppingFavorites={() => controller.setShowShoppingFavorites((current) => !current)}
      onToggleShoppingHistory={() => controller.setShowShoppingHistory((current) => !current)}
      onToggleShoppingCategories={() => controller.setShowShoppingCategories((current) => !current)}
      onChangeCustomCategoryName={controller.setCustomCategoryName}
      onAddCustomCategory={() => void controller.handleAddCustomCategory()}
      onApplyShoppingTemplate={controller.handleApplyShoppingTemplateToComposer}
      onCreateFromShoppingTemplate={(template) => void controller.handleCreateFromShoppingTemplate(template)}
      onToggleBrowseCategory={(category) =>
        controller.setSelectedBrowseCategory((current) => (current === category ? null : category))
      }
      onExpandAll={() => controller.expandMany(controller.expandableIds)}
      onCollapseAll={() => controller.collapseMany(controller.expandableIds)}
      onChangeShoppingSortMode={controller.setShoppingSortMode}
      onChangeShoppingGroupMode={controller.setShoppingGroupMode}
      onDuplicateShoppingList={() => void controller.handleDuplicateShoppingList()}
      onClearDoneShoppingItems={() => void controller.handleClearDoneShoppingItems()}
      renderShoppingGroups={renderShoppingGroups}
    />
  );
}

function renderShoppingGroupsSection(
  group: ShoppingGroup,
  renderItemById: (itemId: string) => ReactNode
) {
  return (
    <View key={group.key} style={group.label ? styles.shoppingGroupSection : undefined}>
      {group.label ? <Text style={styles.shoppingGroupTitle}>{group.label}</Text> : null}
      <View style={styles.shoppingGroupItems}>{group.items.map((item) => renderItemById(item.id))}</View>
    </View>
  );
}
