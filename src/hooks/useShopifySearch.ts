/**
 * GEHNOK Shopify Headless Integration
 * useShopifySearch — Debounced search hook using Shopify predictive search.
 *
 * Falls back to local in-memory filtering if Shopify is unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { useShopifyProducts } from './useShopifyProducts';
import { createShopifyApiUrl } from '../shopify/api';
import { mapShopifyProducts } from '../shopify/mappers';
import { ShopifyProduct } from '../shopify/types';

interface UseShopifySearchResult {
  results: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * Debounced Shopify predictive/full-text search hook.
 * @param query - search string
 * @param debounceMs - debounce delay in milliseconds (default 350)
 */
export function useShopifySearch(
  query: string,
  debounceMs: number = 350
): UseShopifySearchResult {
  const { products: LUXURY_PRODUCTS } = useShopifyProducts();
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const localSearch = useCallback((q: string): Product[] => {
    const lower = q.toLowerCase();
    return LUXURY_PRODUCTS.filter(
      p =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.metal.toLowerCase().includes(lower) ||
        (p.gemstone?.type?.toLowerCase().includes(lower) ?? false)
    );
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          createShopifyApiUrl(`search?q=${encodeURIComponent(query.trim())}&first=10`),
          { signal: abortRef.current.signal }
        );

        if (!res.ok) throw new Error(`Search API responded with ${res.status}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const mapped = mapShopifyProducts((data.products ?? []) as ShopifyProduct[]);
        setResults(mapped);
      } catch (err: any) {
        if (err.name === 'AbortError') return; // intentional cancel
        console.warn('[useShopifySearch] Falling back to local search:', err);
        setError(err.message);
        setResults(localSearch(query));
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs, localSearch]);

  return { results, loading, error };
}
