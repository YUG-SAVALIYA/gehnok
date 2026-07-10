import { useState, useEffect, useCallback } from 'react';
import { createShopifyApiUrl } from '../shopify/api';

interface MetaobjectField {
  key: string;
  value: string;
  reference?: {
    image?: {
      url: string;
      altText?: string;
    };
    url?: string; // For GenericFile references
  };
}

interface ShopifyMetaobject {
  id: string;
  handle: string;
  type: string;
  fields: MetaobjectField[];
}

// Module-level cache to prevent duplicate fetching across component mounts
const globalMetaobjectCache: Record<string, Record<string, string>> = {};

/**
 * Fetch a specific metaobject and convert its fields into a simple Key-Value dictionary.
 * For File (Image) fields, it extracts the CDN URL automatically.
 */
export function useShopifyMetaobject(type: string, handle: string) {
  const cacheKey = `${type}:${handle}`;

  const [data, setData] = useState<Record<string, string>>(globalMetaobjectCache[cacheKey] || {});
  const [loading, setLoading] = useState(!globalMetaobjectCache[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  const fetchMetaobject = useCallback(async () => {
    if (globalMetaobjectCache[cacheKey]) {
      // Already cached, don't refetch
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(createShopifyApiUrl(`metaobjects/${encodeURIComponent(type)}/${encodeURIComponent(handle)}`));

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      const metaobject: ShopifyMetaobject | null = json.metaobject;

      if (!metaobject) {
        throw new Error('Metaobject not found');
      }

      // Convert the array of fields into a clean dictionary
      // Example: { "slide_1": "https://cdn.shopify.com/...", "title": "Welcome" }
      const dictionary: Record<string, string> = {};

      metaobject.fields.forEach(field => {
        // If it's a file/image reference, grab the URL
        if (field.reference?.image?.url) {
          dictionary[field.key] = field.reference.image.url;
        } else if (field.reference?.url) {
          dictionary[field.key] = field.reference.url;
        } else {
          // Otherwise just grab the text value
          dictionary[field.key] = field.value;
        }
      });

      globalMetaobjectCache[cacheKey] = dictionary;
      setData(dictionary);

      // --- NEW: Automatically Preload Images into Browser Cache ---
      // This forces the browser to download the images in the background immediately
      // so when the user navigates to a product page, the images pop up instantly!
      if (typeof window !== 'undefined') {
        Object.values(dictionary).forEach(val => {
          if (val && typeof val === 'string' && (val.includes('cdn.shopify.com') || val.match(/\.(jpeg|jpg|gif|png|svg|webp)/i))) {
            const img = new Image();
            img.src = val;
          }
        });
      }

    } catch (err) {
      console.warn(`[useShopifyMetaobject] Failed to fetch metaobject ${type}/${handle}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [type, handle, cacheKey]);

  useEffect(() => {
    fetchMetaobject();
  }, [fetchMetaobject]);

  return { data, loading, error, refetch: fetchMetaobject };
}
