import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { useI18n } from '../app/providers/PreferencesProvider';
import { ProductDictionaryContent } from './product-dictionary/ProductDictionaryContent';
import { useProductDictionaryController } from './product-dictionary/useProductDictionaryController';

export function ProductDictionaryScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const t = useI18n();
  const controller = useProductDictionaryController(t);

  return (
    <ProductDictionaryContent
      t={t}
      bottomInset={tabBarHeight + 16}
      products={controller.filteredProducts}
      totalProductCount={controller.products.length}
      categories={controller.allCategoryNames}
      selectedCategory={controller.selectedCategory}
      searchQuery={controller.searchQuery}
      formTitle={controller.formTitle}
      formCategory={controller.formCategory}
      formQuantity={controller.formQuantity}
      formUnit={controller.formUnit}
      customCategoryName={controller.customCategoryName}
      editingProductId={controller.editingProductId}
      errorMessage={controller.errorMessage}
      isLoading={controller.isLoading}
      onSetSearchQuery={controller.setSearchQuery}
      onSetSelectedCategory={controller.setSelectedCategory}
      onSetFormTitle={controller.setFormTitle}
      onSetFormCategory={controller.setFormCategory}
      onSetFormQuantity={controller.setFormQuantity}
      onSetFormUnit={controller.setFormUnit}
      onSetCustomCategoryName={controller.setCustomCategoryName}
      onAddCustomCategory={() => void controller.handleAddCustomCategory()}
      onSaveProduct={() => void controller.handleSaveProduct()}
      onResetForm={controller.resetForm}
      onStartEditing={controller.startEditing}
      onRemoveProduct={(productId) => void controller.handleRemoveProduct(productId)}
    />
  );
}
