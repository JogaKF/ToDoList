import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { StateCard } from '../../components/common/StateCard';
import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import type { ShoppingDictionaryProduct } from '../../features/items/types';
import { ui } from '../../theme/ui';
import { allCategoriesFilter, shoppingQuickUnits } from './constants';
import { getProductAmount } from './helpers';
import { styles } from './styles';

type ProductDictionaryContentProps = {
  t: (key: TranslationKey) => string;
  bottomInset: number;
  products: ShoppingDictionaryProduct[];
  totalProductCount: number;
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  formTitle: string;
  formCategory: string;
  formQuantity: string;
  formUnit: string;
  customCategoryName: string;
  editingProductId: string | null;
  errorMessage: string | null;
  isLoading: boolean;
  onSetSearchQuery: (value: string) => void;
  onSetSelectedCategory: (value: string) => void;
  onSetFormTitle: (value: string) => void;
  onSetFormCategory: (value: string) => void;
  onSetFormQuantity: (value: string) => void;
  onSetFormUnit: (value: string) => void;
  onSetCustomCategoryName: (value: string) => void;
  onAddCustomCategory: () => void;
  onSaveProduct: () => void;
  onResetForm: () => void;
  onStartEditing: (product: ShoppingDictionaryProduct) => void;
  onRemoveProduct: (productId: string) => void;
};

export function ProductDictionaryContent({
  t,
  bottomInset,
  products,
  totalProductCount,
  categories,
  selectedCategory,
  searchQuery,
  formTitle,
  formCategory,
  formQuantity,
  formUnit,
  customCategoryName,
  editingProductId,
  errorMessage,
  isLoading,
  onSetSearchQuery,
  onSetSelectedCategory,
  onSetFormTitle,
  onSetFormCategory,
  onSetFormQuantity,
  onSetFormUnit,
  onSetCustomCategoryName,
  onAddCustomCategory,
  onSaveProduct,
  onResetForm,
  onStartEditing,
  onRemoveProduct,
}: ProductDictionaryContentProps) {
  return (
    <ScreenContainer bottomInset={bottomInset}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('dictionary_eyebrow')}</Text>
        <Text style={styles.title}>{t('dictionary_title')}</Text>
        <Text style={styles.subtitle}>{t('dictionary_subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {editingProductId ? t('dictionary_edit_product_title') : t('dictionary_add_product_title')}
        </Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <Text style={styles.inputLabel}>{t('dictionary_name')}</Text>
        <TextInput
          value={formTitle}
          onChangeText={onSetFormTitle}
          style={styles.input}
          placeholder={t('dictionary_name_placeholder')}
          placeholderTextColor={ui.colors.textSoft}
          returnKeyType="done"
          onSubmitEditing={onSaveProduct}
        />
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.inputLabel}>{t('dictionary_quantity')}</Text>
            <TextInput
              value={formQuantity}
              onChangeText={onSetFormQuantity}
              style={styles.input}
              placeholder={t('dictionary_quantity_placeholder')}
              placeholderTextColor={ui.colors.textSoft}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.inputLabel}>{t('dictionary_unit')}</Text>
            <TextInput
              value={formUnit}
              onChangeText={onSetFormUnit}
              style={styles.input}
              placeholder={t('dictionary_unit_placeholder')}
              placeholderTextColor={ui.colors.textSoft}
            />
          </View>
        </View>
        <View style={styles.optionGrid}>
          {shoppingQuickUnits.map((unit) => (
            <PrimaryButton
              key={`dictionary-unit-${unit}`}
              label={unit}
              tone={formUnit === unit ? 'primary' : 'muted'}
              onPress={() => onSetFormUnit(formUnit === unit ? '' : unit)}
            />
          ))}
        </View>
        <Text style={styles.inputLabel}>{t('dictionary_category')}</Text>
        <View style={styles.optionGrid}>
          {categories.map((category) => (
            <PrimaryButton
              key={`dictionary-form-category-${category}`}
              label={category}
              tone={formCategory === category ? 'primary' : 'muted'}
              onPress={() => onSetFormCategory(formCategory === category ? '' : category)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <TextInput
              value={customCategoryName}
              onChangeText={onSetCustomCategoryName}
              style={styles.input}
              placeholder={t('dictionary_custom_category_placeholder')}
              placeholderTextColor={ui.colors.textSoft}
            />
          </View>
          <View style={styles.field}>
            <PrimaryButton
              label={t('dictionary_add_category')}
              tone="muted"
              disabled={!customCategoryName.trim()}
              onPress={onAddCustomCategory}
            />
          </View>
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton
            label={editingProductId ? t('dictionary_save_changes') : t('dictionary_add_product')}
            disabled={!formTitle.trim()}
            onPress={onSaveProduct}
          />
          {editingProductId ? <PrimaryButton label={t('dictionary_cancel_edit')} tone="muted" onPress={onResetForm} /> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dictionary_browse_title')}</Text>
        <TextInput
          value={searchQuery}
          onChangeText={onSetSearchQuery}
          style={styles.input}
          placeholder={t('dictionary_search_placeholder')}
          placeholderTextColor={ui.colors.textSoft}
          autoCapitalize="none"
        />
        <View style={styles.optionGrid}>
          <PrimaryButton
            label={t('dictionary_all')}
            tone={selectedCategory === allCategoriesFilter ? 'primary' : 'muted'}
            onPress={() => onSetSelectedCategory(allCategoriesFilter)}
          />
          {categories.map((category) => (
            <PrimaryButton
              key={`dictionary-filter-${category}`}
              label={category}
              tone={selectedCategory === category ? 'primary' : 'muted'}
              onPress={() => onSetSelectedCategory(selectedCategory === category ? allCategoriesFilter : category)}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <StateCard title={t('dictionary_loading_title')} description={t('dictionary_loading_hint')} tone="warning" />
      ) : null}

      {!isLoading && totalProductCount === 0 ? (
        <StateCard
          title={t('dictionary_empty_title')}
          description={t('dictionary_empty_hint')}
        />
      ) : null}

      {!isLoading && totalProductCount > 0 && products.length === 0 ? (
        <StateCard title={t('dictionary_no_results_title')} description={t('dictionary_no_results_hint')} />
      ) : null}

      {!isLoading && products.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('dictionary_products')} ({products.length})
          </Text>
          {products.map((product) => {
            const amount = getProductAmount(product);
            const meta = product.category ?? (amount ? t('dictionary_no_category') : t('dictionary_no_category_or_unit'));

            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.productMeta}>{amount ?? ''}</Text>
                </View>
                <Text style={styles.productMeta}>{meta}</Text>
                <View style={styles.actionRow}>
                  <PrimaryButton label={t('dictionary_edit')} tone="muted" onPress={() => onStartEditing(product)} />
                  <PrimaryButton label={t('dictionary_delete')} tone="danger" onPress={() => onRemoveProduct(product.id)} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
