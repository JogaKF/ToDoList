import { describe, expect, it } from 'vitest';

import type { ShoppingDictionaryProduct } from '../../features/items/types';
import { allCategoriesFilter } from './constants';
import { buildDictionaryCategoryNames, filterDictionaryProducts, getProductAmount } from './helpers';

function createProduct(overrides: Partial<ShoppingDictionaryProduct>): ShoppingDictionaryProduct {
  return {
    id: overrides.id ?? 'product-1',
    title: overrides.title ?? 'Mleko',
    category: 'category' in overrides ? overrides.category ?? null : 'Nabial',
    quantity: 'quantity' in overrides ? overrides.quantity ?? null : '2',
    unit: 'unit' in overrides ? overrides.unit ?? null : 'l',
    createdAt: overrides.createdAt ?? '2026-04-21T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-21T10:00:00.000Z',
    lastUsedAt: overrides.lastUsedAt ?? '2026-04-21T10:00:00.000Z',
  };
}

describe('product dictionary helpers', () => {
  const products = [
    createProduct({ id: 'milk', title: 'Mleko', category: 'Nabial' }),
    createProduct({ id: 'bread', title: 'Chleb', category: 'Pieczywo', quantity: null, unit: null }),
    createProduct({ id: 'soap', title: 'Mydlo', category: 'Chemia', quantity: '1', unit: 'szt' }),
  ];

  it('formats optional quantity and unit', () => {
    expect(getProductAmount(products[0])).toBe('2 l');
    expect(getProductAmount(products[1])).toBeNull();
    expect(getProductAmount({ quantity: null, unit: 'opak' })).toBe('opak');
  });

  it('filters by search query and category', () => {
    expect(filterDictionaryProducts(products, 'ml', allCategoriesFilter).map((product) => product.id)).toEqual(['milk']);
    expect(filterDictionaryProducts(products, '', 'Chemia').map((product) => product.id)).toEqual(['soap']);
    expect(filterDictionaryProducts(products, 'ch', 'Pieczywo').map((product) => product.id)).toEqual(['bread']);
  });

  it('builds unique sorted category names from defaults, custom categories and products', () => {
    expect(buildDictionaryCategoryNames(['Nabial', 'Owoce'], ['Chemia'], products)).toEqual([
      'Chemia',
      'Nabial',
      'Owoce',
      'Pieczywo',
    ]);
  });
});
