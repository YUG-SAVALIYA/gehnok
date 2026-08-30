import fs from 'fs';
import path from 'path';
import { repriceAllProducts, updateShopMetalRates } from './shopifyPricingUpdater';

export interface DailyMetalRatesData {
  date: string;
  timezone: string;
  source: string;
  currency: string;
  unit: string;
  fetchedAt: string;
  status: string;
  rawRates: {
    gold999: number;
    silver999: number;
  };
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
  lastError?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'metal-rates.json');
let activeRates: DailyMetalRatesData | null = null;
let currentTimer: NodeJS.Timeout | null = null;

function getISTDateString(date: Date = new Date()): string {
  // Format: YYYY-MM-DD in IST
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function loadSavedRates() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      activeRates = JSON.parse(data);
    }
  } catch (err) {
    console.error('[MetalRates] Failed to load saved rates:', err);
  }
}

function saveRates(rates: DailyMetalRatesData) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(rates, null, 2));
    activeRates = rates;
  } catch (err) {
    console.error('[MetalRates] Failed to save rates:', err);
  }
}

export async function fetchDailyRatesFromAPI() {
  const apiKey = process.env.METALS_API_KEY;
  if (!apiKey) {
    console.error('[MetalRates] METALS_API_KEY is not defined.');
    return false;
  }

  const url = `https://api.metals.dev/v1/metal/authority?api_key=${apiKey}&authority=ibja&currency=INR&unit=g`;

  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const result = await response.json();

    if (result.status === 'success' && result.rates && result.rates.ibja_gold > 0 && result.rates.ibja_silver > 0) {
      const ibja_gold = parseFloat(result.rates.ibja_gold);
      const ibja_silver = parseFloat(result.rates.ibja_silver);
      
      const istDate = getISTDateString();
      const fetchedAt = new Date().toISOString();

      const newRates: DailyMetalRatesData = {
        date: istDate,
        timezone: 'Asia/Kolkata',
        source: 'IBJA',
        currency: 'INR',
        unit: 'g',
        fetchedAt,
        status: 'success',
        rawRates: {
          gold999: ibja_gold,
          silver999: ibja_silver
        },
        gold: {
          '9K': ibja_gold * 375 / 999,
          '12K': ibja_gold * 500 / 999,
          '14K': ibja_gold * 585 / 999,
          '18K': ibja_gold * 750 / 999,
          '22K': ibja_gold * 916 / 999,
          '24K': ibja_gold * 999 / 999
        },
        silver: {
          '925': ibja_silver * 925 / 999
        }
      };

      saveRates(newRates);
      console.log(`[MetalRates] Successfully fetched and saved new rates for ${istDate}`);
      
      // Push the rates directly to Shopify Store Settings
      updateShopMetalRates(newRates).catch(err => {
        console.error('[MetalRates] Failed to push rates to Shopify Shop Metafields:', err);
      });

      // Fire and forget bulk repricing for auto-enabled products
      repriceAllProducts().catch(err => {
        console.error('[MetalRates] Background bulk repricing failed:', err);
      });
      
      return true;
    } else {
      throw new Error(`Invalid API response: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    console.error('[MetalRates] Failed to fetch daily rates:', err);
    if (activeRates) {
      activeRates.lastError = err.message;
      activeRates.status = 'error';
    }
    return false;
  }
}

function scheduleNextFetch() {
  const now = new Date();
  
  // Calculate next 5:00 AM IST
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
  const parts = formatter.formatToParts(now);
  
  const istYear = parseInt(parts.find(p => p.type === 'year')!.value);
  const istMonth = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
  const istDay = parseInt(parts.find(p => p.type === 'day')!.value);
  const istHour = parseInt(parts.find(p => p.type === 'hour')!.value);
  
  // Create a Date object representing the same wall-clock time in UTC, just for easier offset math,
  // Or better, just calculate milliseconds to next 05:00:00 IST
  
  // Let's use a simpler approach: check every minute if it's 5:00 AM IST
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(async () => {
    const checkNow = new Date();
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false });
    const p = f.formatToParts(checkNow);
    const h = parseInt(p.find(x => x.type === 'hour')!.value);
    const m = parseInt(p.find(x => x.type === 'minute')!.value);
    
    // Trigger exactly at 05:00 IST
    if (h === 5 && m === 0) {
      const today = getISTDateString(checkNow);
      // Ensure we haven't already fetched today
      if (!activeRates || activeRates.date !== today || activeRates.status !== 'success') {
        const success = await fetchDailyRatesFromAPI();
        if (!success) {
          // If it failed, it will retry next minute since hour=5, min=0 (wait, min will be 1 next time).
          // To implement retry, let's just let it retry in 5 minutes if not successful today.
        }
      }
    } else if (h === 5 && m % 5 === 0) {
        // Retry logic: if between 5:00 and 5:59, retry every 5 minutes if today's rate isn't success
        const today = getISTDateString(checkNow);
        if (!activeRates || activeRates.date !== today || activeRates.status !== 'success') {
            await fetchDailyRatesFromAPI();
        }
    }
  }, 60 * 1000); // check every minute
}

export function initMetalRatesScheduler() {
  loadSavedRates();
  
  // If we don't have rates for today, try fetching immediately
  const today = getISTDateString();
  if (!activeRates || activeRates.date !== today) {
    fetchDailyRatesFromAPI();
  }
  
  scheduleNextFetch();
}

export function getActiveRates() {
  return activeRates;
}
