import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useRecovery } from '../../app/providers/RecoveryProvider';
import type { TranslationKey } from '../../app/providers/PreferencesProvider';
import { useAppDatabase } from '../../db/sqlite';
import { itemsService } from '../../features/items/service';
import type { ShoppingCategory, ShoppingDictionaryProduct } from '../../features/items/types';
import { allCategoriesFilter, defaultShoppingCategories } from './constants';
import { buildDictionaryCategoryNames, filterDictionaryProducts } from './helpers';

type Translator = (key: TranslationKey) => string;

export function useProductDictionaryController(t: Translator) {
  const db = useAppDatabase();
  const { notifyMutation } = useRecovery();
  const [products, setProducts] = useState<ShoppingDictionaryProduct[]>([]);
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(allCategoriesFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [nextProducts, nextCategories] = await Promise.all([
      itemsService.getShoppingDictionaryProducts(db),
      itemsService.getShoppingCategories(db),
    ]);

    setProducts(nextProducts);
    setCategories(nextCategories);
    setIsLoading(false);
  }, [db]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const allCategoryNames = useMemo(
    () =>
      buildDictionaryCategoryNames(
        defaultShoppingCategories,
        categories.map((category) => category.name),
        products
      ),
    [categories, products]
  );

  const filteredProducts = useMemo(
    () => filterDictionaryProducts(products, searchQuery, selectedCategory),
    [products, searchQuery, selectedCategory]
  );

  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormCategory('');
    setFormQuantity('');
    setFormUnit('');
    setEditingProductId(null);
    setErrorMessage(null);
  }, []);

  const startEditing = useCallback((product: ShoppingDictionaryProduct) => {
    setEditingProductId(product.id);
    setFormTitle(product.title);
    setFormCategory(product.category ?? '');
    setFormQuantity(product.quantity ?? '');
    setFormUnit(product.unit ?? '');
    setErrorMessage(null);
  }, []);

  const handleAddCustomCategory = useCallback(async () => {
    const nextName = customCategoryName.trim();
    if (!nextName) {
      return;
    }

    await itemsService.addShoppingCategory(db, nextName);
    setFormCategory(nextName);
    setCustomCategoryName('');
    await loadData();
  }, [customCategoryName, db, loadData]);

  const handleSaveProduct = useCallback(async () => {
    const title = formTitle.trim();
    if (!title) {
      setErrorMessage(t('dictionary_error_name_required'));
      return;
    }

    const payload = {
      title,
      category: formCategory.trim() || null,
      quantity: formQuantity.trim() || null,
      unit: formUnit.trim() || null,
    };

    if (editingProductId) {
      await itemsService.updateShoppingDictionaryProduct(db, editingProductId, payload);
    } else {
      await itemsService.saveShoppingDictionaryProduct(db, payload);
    }

    resetForm();
    notifyMutation();
    await loadData();
  }, [db, editingProductId, formCategory, formQuantity, formTitle, formUnit, loadData, notifyMutation, resetForm, t]);

  const handleRemoveProduct = useCallback(
    (productId: string) => {
      const product = products.find((item) => item.id === productId);
      Alert.alert(
        t('dictionary_remove_title'),
        product ? `"${product.title}"\n${t('dictionary_remove_hint')}` : t('dictionary_remove_hint_missing'),
        [
          { text: t('dictionary_cancel'), style: 'cancel' },
          {
            text: t('dictionary_remove_action'),
            style: 'destructive',
            onPress: () => {
              void itemsService.removeShoppingDictionaryProduct(db, productId).then(async () => {
                if (editingProductId === productId) {
                  resetForm();
                }
                notifyMutation();
                await loadData();
              });
            },
          },
        ]
      );
    },
    [db, editingProductId, loadData, notifyMutation, products, resetForm, t]
  );

  return {
    products,
    filteredProducts,
    categories,
    allCategoryNames,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    formTitle,
    setFormTitle,
    formCategory,
    setFormCategory,
    formQuantity,
    setFormQuantity,
    formUnit,
    setFormUnit,
    customCategoryName,
    setCustomCategoryName,
    editingProductId,
    errorMessage,
    isLoading,
    resetForm,
    startEditing,
    handleAddCustomCategory,
    handleSaveProduct,
    handleRemoveProduct,
  };
}
