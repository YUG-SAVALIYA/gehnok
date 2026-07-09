/**
 * GEHNOK Shopify Headless Integration
 * useShopifyProducts — React hook for fetching product data.
 *
 * Falls back to the existing static LUXURY_PRODUCTS on any API error,
 * ensuring the storefront never goes blank.
 */

import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { LUXURY_PRODUCTS } from '../data';
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
  
  const [products, setProducts] = useState<Product[]>(globalProductsCache[cacheKey] || LUXURY_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (collection) {
        url = `/api/shopify/collections/${encodeURIComponent(collection)}/products?first=${first}`;
      } else {
        url = `/api/shopify/products?first=${first}&sortKey=${sortKey}&reverse=${reverse}`;
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
      const result = mapped.length > 0 ? mapped : LUXURY_PRODUCTS;
      globalProductsCache[cacheKey] = result;
      setProducts(result);
    } catch (err) {
      console.warn('[useShopifyProducts] Failed to fetch from Shopify, using static fallback:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProducts(LUXURY_PRODUCTS); // graceful fallback
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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!handle) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopify/products/${encodeURIComponent(handle)}`);
      if (!res.ok) throw new Error(`API responded with status ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.product) throw new Error('Product not found');

      const { mapShopifyProductToProduct } = await import('../shopify/mappers');
      setProduct(mapShopifyProductToProduct(data.product));
    } catch (err) {
      console.warn('[useShopifyProduct] Fallback to static data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback: find in static data by handle
      const fallback = LUXURY_PRODUCTS.find(p => p.id === handle) ?? null;
      setProduct(fallback);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
