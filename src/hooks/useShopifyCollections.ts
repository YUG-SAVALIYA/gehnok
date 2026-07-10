import { useState, useEffect, useCallback } from 'react';

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: { url: string; altText?: string };
}

let globalCollectionsCache: ShopifyCollection[] | null = null;

export function useShopifyCollections(first: number = 20) {
  const [collections, setCollections] = useState<ShopifyCollection[]>(globalCollectionsCache || []);
  const [loading, setLoading] = useState(!globalCollectionsCache);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (globalCollectionsCache && globalCollectionsCache.length > 0) {
      setCollections(globalCollectionsCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://gehnok.gehnokjewels.workers.dev/api/shopify/collections?first=${first}`);
      if (!res.ok) throw new Error(`API responded with status ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // The backend already unwraps the edges into an array of nodes
      const mapped: ShopifyCollection[] = (data.collections || []).map((node: any) => ({
        id: node.id,
        handle: node.handle,
        title: node.title,
        description: node.description,
        image: node.image,
      }));

      console.log('[useShopifyCollections] Fetched collections:', mapped);
      globalCollectionsCache = mapped;
      setCollections(mapped);
    } catch (err) {
      console.warn('[useShopifyCollections] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [first]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, error, refetch: fetchCollections };
}
