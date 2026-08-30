import { getActiveRates, DailyMetalRatesData } from './metalRatesScheduler';
import fs from 'fs';
import path from 'path';

// Shopify Metafield values mapping to existing gehnok structure
export interface ProductPricingConfig {
  product_id: string;
  variant_id: string; 
  
  metal_type: string; // From custom.metal (e.g. 'Gold', 'Silver', 'Rose Gold')
  metal_purity: string; // From custom.purity (e.g. '18K', '14K', '925')
  metal_weight_g: number; // From custom.weight

  making_charge: number; // From custom.making_charge (Fixed ₹ amount)
  tax_percentage: number; // From custom.tax (Percentage, e.g. 3)
}

export interface PricingResult {
  metal: {
    type: string;
    purity: string;
    weight_g: number;
    daily_rate: number;
    metal_value: number;
  };
  making_charge: number;
  subtotal: number; // cost before tax
  tax: number;
  final_price: number;
}

export function getProductMetalRate(config: ProductPricingConfig, dailyRates: DailyMetalRatesData): number {
  const isSilver = config.metal_type.toLowerCase().includes('silver');
  if (isSilver) {
    return dailyRates.silver['925'];
  } else {
    // Gold
    const purity = config.metal_purity.toUpperCase().replace(/[^0-9K]/g, '');
    return dailyRates.gold[purity as keyof typeof dailyRates.gold] || dailyRates.gold['18K'];
  }
}

export function calculateProductPricing(config: ProductPricingConfig): PricingResult | null {
  const dailyRates = getActiveRates();
  if (!dailyRates || dailyRates.status !== 'success') {
    return null; // Cannot calculate without valid daily rates
  }

  const dailyRate = getProductMetalRate(config, dailyRates);
  if (!dailyRate || config.metal_weight_g <= 0) {
    return null; // Invalid rate or weight
  }

  // 1. Metal Value
  const metal_value = dailyRate * config.metal_weight_g;

  // 2. Making Charge
  const making_charge = config.making_charge || 0;

  // 3. Subtotal
  const subtotal = metal_value + making_charge;

  // 4. Tax (GST)
  const tax_percentage = config.tax_percentage || 0;
  const tax = subtotal * (tax_percentage / 100);

  // Final Price
  const final_price = subtotal + tax;

  return {
    metal: {
      type: config.metal_type,
      purity: config.metal_purity,
      weight_g: config.metal_weight_g,
      daily_rate: dailyRate,
      metal_value,
    },
    making_charge,
    subtotal,
    tax,
    final_price
  };
}

export interface PricingHistoryRecord {
  product_id: string;
  variant_id: string;
  rate_date: string;
  gold_rate_999: number;
  silver_rate_999: number;
  purity: string;
  metal_rate_used: number;
  metal_weight: number;
  making_charge: number;
  tax: number;
  final_price: number;
  updated_at: string;
}

const HISTORY_FILE = path.join(process.cwd(), 'pricing-history.json');

export function logPricingHistory(record: PricingHistoryRecord) {
  try {
    let history: PricingHistoryRecord[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
    history.push(record);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('[PricingEngine] Failed to log pricing history:', err);
  }
}

export function getPricingHistory(productId?: string): PricingHistoryRecord[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const history: PricingHistoryRecord[] = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      if (productId) {
        return history.filter(h => h.product_id === productId);
      }
      return history;
    }
  } catch (err) {
    console.error('[PricingEngine] Failed to read pricing history:', err);
  }
  return [];
}
