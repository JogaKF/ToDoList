import type { ShoppingDictionaryProduct } from '../../features/items/types';
import { allCategoriesFilter } from './constants';

export function getProductAmount(product: Pick<ShoppingDictionaryProduct, 'quantity' | 'unit'>) {
  if (!product.quantity && !product.unit) {
    return null;
  }

  return `${product.quantity ?? ''}${product.quantity && product.unit ? ' ' : ''}${product.unit ?? ''}`.trim();
}

export function filterDictionaryProducts(
  products: ShoppingDictionaryProduct[],
  searchQuery: string,
  selectedCategory: string
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedCategory = selectedCategory.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === allCategoriesFilter ||
      (product.category?.trim().toLowerCase() ?? '') === normalizedCategory;
    const matchesQuery =
      !normalizedQuery ||
      product.title.trim().toLowerCase().includes(normalizedQuery) ||
      (product.category?.trim().toLowerCase() ?? '').includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function buildDictionaryCategoryNames(
  defaults: readonly string[],
  customCategories: string[],
  products: ShoppingDictionaryProduct[]
) {
  const merged = [
    ...defaults,
    ...customCategories,
    ...products.map((product) => product.category ?? ''),
  ];

  return Array.from(new Set(merged.map((category) => category.trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, 'pl', { sensitivity: 'base' })
  );
}
