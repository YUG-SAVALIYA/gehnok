import { useState, useEffect } from 'react';

export interface ShopifyPolicy {
  title: string;
  body: string;
}

export interface ShopPolicies {
  privacyPolicy: ShopifyPolicy | null;
  shippingPolicy: ShopifyPolicy | null;
  termsOfService: ShopifyPolicy | null;
  refundPolicy: ShopifyPolicy | null;
}

export function useShopifyPolicies() {
  const [policies, setPolicies] = useState<ShopPolicies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await fetch('https://gehnok.gehnokjewels.workers.dev/api/shopify/policies');
        if (!res.ok) throw new Error(`Failed to fetch policies: ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setPolicies(data.shop as ShopPolicies);
      } catch (err) {
        console.error('[useShopifyPolicies] error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  return { policies, loading, error };
}
