// We'll define the base API path for our local/worker proxy
const API_BASE = '/api';

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

let cachedRates: DailyMetalRates | null = null;
let fetchPromise: Promise<DailyMetalRates | null> | null = null;

/**
 * Fetch the active daily metal rates from the backend.
 * Uses a singleton promise to prevent duplicate concurrent network requests.
 */
export async function getDailyMetalRates(): Promise<DailyMetalRates | null> {
  if (cachedRates) return cachedRates;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(`${API_BASE}/metal-rates`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch daily metal rates');
      return res.json();
    })
    .then((data: DailyMetalRates) => {
      cachedRates = data;
      fetchPromise = null;
      return data;
    })
    .catch((err) => {
      console.error('[PricingService] Error fetching metal rates:', err);
      fetchPromise = null;
      return null;
    });

  return fetchPromise;
}

/**
 * Get the gold rate for a specific purity.
 */
export function getGoldRate(purity: keyof DailyMetalRates['gold']): number | null {
  if (!cachedRates) return null;
  return cachedRates.gold[purity] || null;
}

/**
 * Get the gold rate by purity and color.
 * As per requirements, color does NOT affect the raw gold rate,
 * but this function exists for future alloy/rhodium adjustments.
 */
export function getGoldRateByColor(purity: keyof DailyMetalRates['gold'], color: string): number | null {
  // In the future, we could add switch(color) to add rhodium/alloy costs.
  // For now, it simply returns the raw purity rate.
  return getGoldRate(purity);
}

/**
 * Get the silver rate (defaults to 925).
 */
export function getSilverRate(): number | null {
  return get925SilverRate();
}

/**
 * Get the 925 Silver rate specifically.
 */
export function get925SilverRate(): number | null {
  if (!cachedRates) return null;
  return cachedRates.silver['925'] || null;
}
