import { SHOPIFY_API_BASE, createShopifyApiUrl } from '../shopify/api';

export interface DailyMetalRates {
  date: string;
  source: string;
  currency: string;
  unit: string;
  updatedAt: string;
  gold: {
    '9K': number;
    '12K': number;
    '14K': number;
    '18K': number;
    '22K': number;
    '24K': number;
  };
  silver: {
    '925': number;
  };
}

export const DEFAULT_METAL_RATES: DailyMetalRates = {
  date: new Date().toISOString().split('T')[0],
  source: 'IBJA',
  currency: 'INR',
  unit: 'g',
  updatedAt: 'Live',
  gold: {
    '9K': 5813.82,
    '12K': 7751.77,
    '14K': 9069.57,
    '18K': 11627.65,
    '22K': 14201.23,
    '24K': 15488.03,
  },
  silver: {
    '925': 218.02,
  },
};

let cachedRates: DailyMetalRates = DEFAULT_METAL_RATES;
let hasFetchedLiveRates = false;
let fetchPromise: Promise<DailyMetalRates> | null = null;

/**
 * Fetch the active daily metal rates from the backend.
 * Uses a singleton promise to prevent duplicate concurrent network requests.
 * Tries multiple endpoints (worker, storefront GraphQL, local server) and falls back safely.
 */
export async function getDailyMetalRates(): Promise<DailyMetalRates> {
  if (hasFetchedLiveRates) return cachedRates;
  if (fetchPromise) return fetchPromise;

  const workerBase = SHOPIFY_API_BASE.replace(/\/shopify\/?$/, '');
  const candidateUrls = [
    `${workerBase}/metal-rates`,
    createShopifyApiUrl('metal-rates'),
    '/api/metal-rates',
    '/api/shopify/metal-rates',
  ];

  fetchPromise = (async () => {
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.gold && data.silver) {
            cachedRates = data as DailyMetalRates;
            hasFetchedLiveRates = true;
            fetchPromise = null;
            return cachedRates;
          }
        }
      } catch {
        // Continue to next candidate URL
      }
    }

    // Direct fallback to query shop metafields through storefront GraphQL
    try {
      const gqlRes = await fetch(createShopifyApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query {
            shop {
              gold: metafield(namespace: "custom", key: "daily_gold_rate") { value }
              silver: metafield(namespace: "custom", key: "daily_silver_rate") { value }
            }
          }`
        })
      });
      if (gqlRes.ok) {
        const gqlData = await gqlRes.json() as any;
        const goldVal = parseFloat(gqlData?.data?.shop?.gold?.value);
        const silverVal = parseFloat(gqlData?.data?.shop?.silver?.value);
        if (goldVal > 0 && silverVal > 0) {
          cachedRates = {
            date: new Date().toISOString().split('T')[0],
            source: 'IBJA',
            currency: 'INR',
            unit: 'g',
            updatedAt: 'Live',
            gold: {
              '9K': Math.round((goldVal * 375 / 999) * 100) / 100,
              '12K': Math.round((goldVal * 500 / 999) * 100) / 100,
              '14K': Math.round((goldVal * 585 / 999) * 100) / 100,
              '18K': Math.round((goldVal * 750 / 999) * 100) / 100,
              '22K': Math.round((goldVal * 916 / 999) * 100) / 100,
              '24K': Math.round(goldVal * 100) / 100,
            },
            silver: {
              '925': Math.round((silverVal * 925 / 999) * 100) / 100,
            },
          };
          hasFetchedLiveRates = true;
          fetchPromise = null;
          return cachedRates;
        }
      }
    } catch {
      // Ignore and use default rates
    }

    fetchPromise = null;
    return cachedRates;
  })();

  return fetchPromise;
}

/**
 * Get the gold rate for a specific purity.
 */
export function getGoldRate(purity: keyof DailyMetalRates['gold']): number {
  return cachedRates.gold[purity] || cachedRates.gold['18K'] || 11628;
}

/**
 * Get the gold rate by purity and color.
 */
export function getGoldRateByColor(purity: keyof DailyMetalRates['gold'], color: string): number {
  return getGoldRate(purity);
}

/**
 * Get the silver rate (defaults to 925).
 */
export function getSilverRate(): number {
  return get925SilverRate();
}

/**
 * Get the 925 Silver rate specifically.
 */
export function get925SilverRate(): number {
  return cachedRates.silver['925'] || 218;
}
