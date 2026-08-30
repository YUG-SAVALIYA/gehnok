import { getActiveRates, DailyMetalRatesData } from './metalRatesScheduler';
import fs from 'fs';
import path from 'path';

// Shopify Metafield values
export interface ProductPricingConfig {
  product_id: string;
  variant_id: string; // If product has variants, each can have its own config, or fall back to product
  
  metal_type: 'Gold' | 'Silver';
  gold_color?: 'Yellow Gold' | 'Rose Gold' | 'White Gold';
  gold_purity?: '9K' | '12K' | '14K' | '18K' | '22K' | '24K';
  silver_purity?: '925';
  metal_weight_g: number;

  wastage_type: 'percentage' | 'grams' | 'none';
  wastage_value: number;

  making_charge_type: 'fixed' | 'per_gram' | 'percentage' | 'none';
  making_charge_value: number;

  stone_cost: number;
  other_cost: number;

  margin_type: 'percentage' | 'fixed' | 'none';
  margin_value: number;

  discount_type: 'percentage' | 'fixed' | 'none';
  discount_value: number;

  gst_percentage: number;

  auto_pricing_enabled: boolean;
}

export interface PricingResult {
  metal: {
    type: string;
    color?: string;
    purity?: string;
    weight_g: number;
    daily_rate: number;
    metal_value: number;
  };
  wastage: {
    type: string;
    value: number;
    weight_g: number;
    cost: number;
  };
  making_charge: {
    type: string;
    value: number;
    cost: number;
  };
  stone_cost: number;
  other_cost: number;
  subtotal: number; // cost before margin
  margin: number;
  price_before_discount: number;
  discount: number;
  price_after_discount: number;
  gst: number;
  final_price: number;
}

export function getProductMetalRate(config: ProductPricingConfig, dailyRates: DailyMetalRatesData): number {
  if (config.metal_type === 'Silver') {
    return dailyRates.silver['925'];
  } else {
    // Gold
    const purity = config.gold_purity || '18K';
    return dailyRates.gold[purity as keyof typeof dailyRates.gold] || 0;
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

  // 2. Wastage
  let wastage_weight_g = 0;
  if (config.wastage_type === 'percentage') {
    wastage_weight_g = config.metal_weight_g * (config.wastage_value / 100);
  } else if (config.wastage_type === 'grams') {
    wastage_weight_g = config.wastage_value;
  }
  const wastage_cost = wastage_weight_g * dailyRate;

  // 3. Making Charge
  let making_charge_cost = 0;
  if (config.making_charge_type === 'fixed') {
    making_charge_cost = config.making_charge_value;
  } else if (config.making_charge_type === 'per_gram') {
    making_charge_cost = config.making_charge_value * config.metal_weight_g;
  } else if (config.making_charge_type === 'percentage') {
    making_charge_cost = (metal_value + wastage_cost) * (config.making_charge_value / 100);
  }

  // 4. Subtotal (Cost Before Margin)
  const stone_cost = config.stone_cost || 0;
  const other_cost = config.other_cost || 0;
  const subtotal = metal_value + wastage_cost + making_charge_cost + stone_cost + other_cost;

  // 5. Margin
  let margin_amount = 0;
  if (config.margin_type === 'fixed') {
    margin_amount = config.margin_value;
  } else if (config.margin_type === 'percentage') {
    margin_amount = subtotal * (config.margin_value / 100);
  }

  const price_before_discount = subtotal + margin_amount;

  // 6. Discount
  let discount_amount = 0;
  if (config.discount_type === 'fixed') {
    discount_amount = config.discount_value;
  } else if (config.discount_type === 'percentage') {
    discount_amount = price_before_discount * (config.discount_value / 100);
  }

  const price_after_discount = price_before_discount - discount_amount;

  // 7. GST
  const gst_percentage = config.gst_percentage || 0;
  const gst_amount = price_after_discount * (gst_percentage / 100);

  // Final Price
  const final_price = price_after_discount + gst_amount;

  return {
    metal: {
      type: config.metal_type,
      color: config.gold_color,
      purity: config.metal_type === 'Gold' ? config.gold_purity : config.silver_purity,
      weight_g: config.metal_weight_g,
      daily_rate: dailyRate,
      metal_value,
    },
    wastage: {
      type: config.wastage_type,
      value: config.wastage_value,
      weight_g: wastage_weight_g,
      cost: wastage_cost,
    },
    making_charge: {
      type: config.making_charge_type,
      value: config.making_charge_value,
      cost: making_charge_cost,
    },
    stone_cost,
    other_cost,
    subtotal,
    margin: margin_amount,
    price_before_discount,
    discount: discount_amount,
    price_after_discount,
    gst: gst_amount,
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
  wastage: number;
  making_charge: number;
  stone_cost: number;
  other_cost: number;
  margin: number;
  discount: number;
  gst: number;
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
