/**
 * GEHNOK Shopify Headless Integration
 * useShopifyProducts — React hook for fetching product data.
 *
 * Falls back to the existing static LUXURY_PRODUCTS on any API error,
 * ensuring the storefront never goes blank.
 */

import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { createShopifyApiUrl } from '../shopify/api';
import { mapShopifyProducts } from '../shopify/mappers';
import { ShopifyProduct } from '../shopify/types';

interface UseShopifyProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseShopifyProductsOptions {
  collection?: string;  // Collection handle, e.g. 'rings', 'necklaces'
  first?: number;       // Page size
  sortKey?: 'TITLE' | 'PRICE' | 'CREATED_AT' | 'BEST_SELLING';
  reverse?: boolean;
}

// ─── Module-level Cache ───
let globalProductsCache: Record<string, Product[]> = {};

/**
 * Fetch products from the Shopify Storefront API via our secure Express proxy.
 * Falls back to static data on error.
 */
export function useShopifyProducts(
  options: UseShopifyProductsOptions = {}
): UseShopifyProductsResult {
  const { collection, first = 50, sortKey = 'CREATED_AT', reverse = false } = options;
  const cacheKey = `${collection || 'all'}:${first}:${sortKey}:${reverse}`;

  const hasCache = !!globalProductsCache[cacheKey];
  const [products, setProducts] = useState<Product[]>(globalProductsCache[cacheKey] || []);
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // If it's cached, ensure the state matches the cache for this cacheKey
    if (globalProductsCache[cacheKey]) {
      setProducts(globalProductsCache[cacheKey]);
      setLoading(false);
      return; // Already cached, avoid re-fetching
    }

    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (collection) {
        url = createShopifyApiUrl(`collections/${encodeURIComponent(collection)}/products?first=${first}`);
      } else {
        url = createShopifyApiUrl(`products?first=${first}&sortKey=${sortKey}&reverse=${reverse}`);
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid products response shape');
      }

      const mapped = mapShopifyProducts(data.products as ShopifyProduct[]);
      const result = mapped;
      globalProductsCache[cacheKey] = result;
      setProducts(result);
    } catch (err) {
      console.warn('[useShopifyProducts] Failed to fetch from Shopify:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProducts([]); // Show empty state on error instead of dummy data
    } finally {
      setLoading(false);
    }
  }, [collection, first, sortKey, reverse]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

// ─── Single Product Hook ──────────────────────────────────────────────────────

interface UseShopifyProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch a single product by its Shopify handle.
 * Falls back to matching static product on error.
 */
export function useShopifyProduct(handle: string): UseShopifyProductResult {
  const cacheKey = `product:${handle}`;
  const hasCache = !!globalProductsCache[cacheKey];

  const [product, setProduct] = useState<Product | null>(
    hasCache ? globalProductsCache[cacheKey][0] : null
  );
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!handle) {
      setLoading(false);
      return;
    }

    if (globalProductsCache[cacheKey]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(createShopifyApiUrl(`products/${encodeURIComponent(handle)}`));
      if (!res.ok) throw new Error(`API responded with status ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.product) throw new Error('Product not found');

      const { mapShopifyProductToProduct } = await import('../shopify/mappers');
      const finalProduct = mapShopifyProductToProduct(data.product);
      globalProductsCache[cacheKey] = [finalProduct];
      setProduct(finalProduct);
    } catch (err) {
      console.warn('[useShopifyProduct] Failed to fetch from Shopify:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
