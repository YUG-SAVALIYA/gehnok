import { useState, useEffect, useCallback } from 'react';

export interface ShopifyArticle {
  id: string;
  handle: string;
  title: string;
  publishedAt: string;
  contentHtml: string;
  excerptHtml: string;
  image?: { url: string; altText?: string };
  authorV2?: { name: string };
  blog?: { title: string };
}

let globalArticlesCache: Record<string, ShopifyArticle[]> = {};

export function useShopifyArticles(first: number = 3) {
  const cacheKey = `articles:${first}`;
  const hasCache = !!globalArticlesCache[cacheKey];

  const [articles, setArticles] = useState<ShopifyArticle[]>(globalArticlesCache[cacheKey] || []);
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    if (globalArticlesCache[cacheKey]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://gehnok.gehnokjewels.workers.dev/api/shopify/articles?first=${first}`);
      if (!res.ok) throw new Error(`API responded with status ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      globalArticlesCache[cacheKey] = data.articles || [];
      setArticles(data.articles || []);
    } catch (err) {
      console.warn('[useShopifyArticles] Failed to fetch from Shopify:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [first, cacheKey]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles };
}
