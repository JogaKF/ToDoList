import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { ShoppingGroup } from './helpers';
import { ListComposerSection } from './ListComposerSection';
import { styles } from './styles';

type ListDetailsContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  listName: string;
  isShoppingList: boolean;
  listSummary: { totalItems: number; doneItems: number; openItems: number };
  isLoading: boolean;
  visibleItemsCount: number;
  newTaskTitle: string;
  newTaskError: string | null;
  composerCategory: string;
  composerQuantity: string;
  composerUnit: string;
  composerNote: string;
  composerDueDate: string;
  composerRecurrenceType: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'custom';
  composerRecurrenceInterval: string;
  composerRecurrenceUnit: 'days' | 'weeks' | 'months';
  showComposerDetails: boolean;
  showShoppingDetails: boolean;
  showShoppingFavorites: boolean;
  showShoppingHistory: boolean;
  showShoppingCategories: boolean;
  customCategoryName: string;
  allShoppingCategoryNames: string[];
  shoppingSuggestions: Parameters<typeof ListComposerSection>[0]['shoppingSuggestions'];
  shoppingFavorites: Parameters<typeof ListComposerSection>[0]['shoppingFavorites'];
  shoppingHistory: Parameters<typeof ListComposerSection>[0]['shoppingHistory'];
  selectedBrowseCategory: string | null;
  browseCategoryTemplates: Parameters<typeof ListComposerSection>[0]['browseCategoryTemplates'];
  expandableIds: string[];
  shoppingSortMode: 'manual' | 'alpha';
  shoppingGroupMode: 'flat' | 'unit' | 'category';
  shoppingDoneItemsCount: number;
  taskOpenItems: ReactNode[];
  taskDoneItems: ReactNode[];
  shoppingOpenGroups: ShoppingGroup[];
  shoppingDoneGroups: ShoppingGroup[];
  showCompleted: boolean;
  onChangeNewTaskTitle: (value: string) => void;
  onSubmitRootTask: () => void;
  onChangeComposerCategory: (value: string) => void;
  onChangeComposerQuantity: (value: string) => void;
  onChangeComposerUnit: (value: string) => void;
  onChangeComposerNote: (value: string) => void;
  onChangeComposerDueDate: (value: string) => void;
  onChangeComposerRecurrenceType: (value: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'custom') => void;
  onChangeComposerRecurrenceInterval: (value: string) => void;
  onChangeComposerRecurrenceUnit: (value: 'days' | 'weeks' | 'months') => void;
  onToggleComposerDetails: () => void;
  onToggleShoppingDetails: () => void;
  onToggleShoppingFavorites: () => void;
  onToggleShoppingHistory: () => void;
  onToggleShoppingCategories: () => void;
  onChangeCustomCategoryName: (value: string) => void;
  onAddCustomCategory: () => void;
  onApplyShoppingTemplate: Parameters<typeof ListComposerSection>[0]['onApplyShoppingTemplate'];
  onCreateFromShoppingTemplate: Parameters<typeof ListComposerSection>[0]['onCreateFromShoppingTemplate'];
  onToggleBrowseCategory: (category: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onChangeShoppingSortMode: (mode: 'manual' | 'alpha') => void;
  onChangeShoppingGroupMode: (mode: 'flat' | 'unit' | 'category') => void;
  onDuplicateShoppingList: () => void;
  onClearDoneShoppingItems: () => void;
  renderShoppingGroups: (groups: ShoppingGroup[]) => ReactNode;
};

export function ListDetailsContent(props: ListDetailsContentProps) {
  const {
    t,
    bottomInset,
    listName,
    isShoppingList,
    listSummary,
    isLoading,
    visibleItemsCount,
    newTaskTitle,
    newTaskError,
    composerCategory,
    composerQuantity,
    composerUnit,
    composerNote,
    composerDueDate,
    composerRecurrenceType,
    composerRecurrenceInterval,
    composerRecurrenceUnit,
    showComposerDetails,
    showShoppingDetails,
    showShoppingFavorites,
    showShoppingHistory,
    showShoppingCategories,
    customCategoryName,
    allShoppingCategoryNames,
    shoppingSuggestions,
    shoppingFavorites,
    shoppingHistory,
    selectedBrowseCategory,
    browseCategoryTemplates,
    expandableIds,
    shoppingSortMode,
    shoppingGroupMode,
    shoppingDoneItemsCount,
    taskOpenItems,
    taskDoneItems,
    shoppingOpenGroups,
    shoppingDoneGroups,
    showCompleted,
    onChangeNewTaskTitle,
    onSubmitRootTask,
    onChangeComposerCategory,
    onChangeComposerQuantity,
    onChangeComposerUnit,
    onChangeComposerNote,
    onChangeComposerDueDate,
    onChangeComposerRecurrenceType,
    onChangeComposerRecurrenceInterval,
    onChangeComposerRecurrenceUnit,
    onToggleComposerDetails,
    onToggleShoppingDetails,
    onToggleShoppingFavorites,
    onToggleShoppingHistory,
    onToggleShoppingCategories,
    onChangeCustomCategoryName,
    onAddCustomCategory,
    onApplyShoppingTemplate,
    onCreateFromShoppingTemplate,
    onToggleBrowseCategory,
    onExpandAll,
    onCollapseAll,
    onChangeShoppingSortMode,
    onChangeShoppingGroupMode,
    onDuplicateShoppingList,
    onClearDoneShoppingItems,
    renderShoppingGroups,
  } = props;

  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{listName}</Text>
        <Text style={styles.headerMeta}>{isShoppingList ? 'Tryb zakupow' : 'Tryb taskow'}</Text>
        <Text style={styles.headerSubmeta}>
          {isShoppingList
            ? `${listSummary.openItems} do kupienia, ${listSummary.doneItems} kupionych`
            : `${listSummary.totalItems} aktywnych pozycji w drzewie`}
        </Text>
      </View>

      <ListComposerSection
        t={t}
        isShoppingList={isShoppingList}
        newTaskTitle={newTaskTitle}
        newTaskError={newTaskError}
        onChangeNewTaskTitle={onChangeNewTaskTitle}
        onSubmit={onSubmitRootTask}
        composerCategory={composerCategory}
        composerQuantity={composerQuantity}
        composerUnit={composerUnit}
        composerNote={composerNote}
        composerDueDate={composerDueDate}
        composerRecurrenceType={composerRecurrenceType}
        composerRecurrenceInterval={composerRecurrenceInterval}
        composerRecurrenceUnit={composerRecurrenceUnit}
        onChangeComposerCategory={onChangeComposerCategory}
        onChangeComposerQuantity={onChangeComposerQuantity}
        onChangeComposerUnit={onChangeComposerUnit}
        onChangeComposerNote={onChangeComposerNote}
        onChangeComposerDueDate={onChangeComposerDueDate}
        onChangeComposerRecurrenceType={onChangeComposerRecurrenceType}
        onChangeComposerRecurrenceInterval={onChangeComposerRecurrenceInterval}
        onChangeComposerRecurrenceUnit={onChangeComposerRecurrenceUnit}
        showComposerDetails={showComposerDetails}
        onToggleComposerDetails={onToggleComposerDetails}
        showShoppingDetails={showShoppingDetails}
        showShoppingFavorites={showShoppingFavorites}
        showShoppingHistory={showShoppingHistory}
        showShoppingCategories={showShoppingCategories}
        onToggleShoppingDetails={onToggleShoppingDetails}
        onToggleShoppingFavorites={onToggleShoppingFavorites}
        onToggleShoppingHistory={onToggleShoppingHistory}
        onToggleShoppingCategories={onToggleShoppingCategories}
        customCategoryName={customCategoryName}
        onChangeCustomCategoryName={onChangeCustomCategoryName}
        onAddCustomCategory={onAddCustomCategory}
        allShoppingCategoryNames={allShoppingCategoryNames}
        shoppingSuggestions={shoppingSuggestions}
        shoppingFavorites={shoppingFavorites}
        shoppingHistory={shoppingHistory}
        onApplyShoppingTemplate={onApplyShoppingTemplate}
        onCreateFromShoppingTemplate={onCreateFromShoppingTemplate}
        selectedBrowseCategory={selectedBrowseCategory}
        onToggleBrowseCategory={onToggleBrowseCategory}
        browseCategoryTemplates={browseCategoryTemplates}
      />

      {!isShoppingList && expandableIds.length > 0 ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton label={t('details_expand_all')} onPress={onExpandAll} tone="muted" />
          <PrimaryButton label={t('details_collapse_all')} onPress={onCollapseAll} tone="muted" />
        </View>
      ) : null}

      {isShoppingList ? (
        <View style={styles.toolbarRow}>
          <PrimaryButton label="Kolejnosc reczna" tone={shoppingSortMode === 'manual' ? 'primary' : 'muted'} onPress={() => onChangeShoppingSortMode('manual')} />
          <PrimaryButton label="A-Z" tone={shoppingSortMode === 'alpha' ? 'primary' : 'muted'} onPress={() => onChangeShoppingSortMode('alpha')} />
          <PrimaryButton label="Bez grup" tone={shoppingGroupMode === 'flat' ? 'primary' : 'muted'} onPress={() => onChangeShoppingGroupMode('flat')} />
          <PrimaryButton label="Grupuj kategorie" tone={shoppingGroupMode === 'category' ? 'primary' : 'muted'} onPress={() => onChangeShoppingGroupMode('category')} />
          <PrimaryButton label="Grupuj jednostki" tone={shoppingGroupMode === 'unit' ? 'primary' : 'muted'} onPress={() => onChangeShoppingGroupMode('unit')} />
          <PrimaryButton label="Kopiuj liste" tone="muted" onPress={onDuplicateShoppingList} />
          {shoppingDoneItemsCount > 0 ? <PrimaryButton label="Wyczysc kupione" tone="danger" onPress={onClearDoneShoppingItems} /> : null}
        </View>
      ) : null}

      <View style={styles.treeWrap}>
        {isLoading ? <StateCard title={t('details_loading')} description={t('details_loading_hint')} /> : null}

        {!isLoading && visibleItemsCount === 0 ? (
          <StateCard
            title={isShoppingList ? t('details_empty_shopping') : t('details_empty_tasks')}
            description={isShoppingList ? t('details_empty_shopping_hint') : t('details_empty_tasks_hint')}
          />
        ) : null}

        {isShoppingList ? renderShoppingGroups(shoppingOpenGroups) : taskOpenItems}

        {!isShoppingList && showCompleted && taskDoneItems.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Ukonczone</Text>
            {taskDoneItems}
          </View>
        ) : null}

        {isShoppingList && showCompleted && shoppingDoneGroups.length > 0 ? (
          <View style={styles.doneSection}>
            <Text style={styles.doneSectionTitle}>Kupione</Text>
            {renderShoppingGroups(shoppingDoneGroups)}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
