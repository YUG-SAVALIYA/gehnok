import { ProductPricingConfig, calculateProductPricing, logPricingHistory, PricingResult } from './productPricingEngine';
import { getActiveRates } from './metalRatesScheduler';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
// Needs Admin API Token to update variants (Storefront API is read-only)
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

async function shopifyAdminGraphQL(query: string, variables: any = {}) {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error('Shopify Admin credentials are not configured.');
  }

  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL Error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/**
 * Updates a specific variant price in Shopify.
 */
export async function updateShopifyVariantPrice(variantId: string, finalPrice: number) {
  const query = `
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Final price rounding logic: Shopify requires a string/number that represents currency.
  // We'll round it to 2 decimal places to be safe.
  const priceString = finalPrice.toFixed(2);

  const variables = {
    input: {
      id: variantId.includes('gid://') ? variantId : `gid://shopify/ProductVariant/${variantId}`,
      price: priceString
    }
  };

  const data = await shopifyAdminGraphQL(query, variables);
  
  if (data?.productVariantUpdate?.userErrors?.length > 0) {
    throw new Error(`Failed to update variant price: ${JSON.stringify(data.productVariantUpdate.userErrors)}`);
  }

  return true;
}

/**
 * Perform a full reprice of a product variant and update Shopify.
 */
export async function repriceVariant(config: ProductPricingConfig) {
  const result = calculateProductPricing(config);
  if (!result) {
    throw new Error('Failed to calculate pricing. Are daily rates available and weight > 0?');
  }

  if (isNaN(result.final_price) || result.final_price <= 0) {
    throw new Error('Calculated final price is invalid.');
  }

  // Update Shopify
  await updateShopifyVariantPrice(config.variant_id, result.final_price);

  // Log to history
  const activeRates = getActiveRates();
  logPricingHistory({
    product_id: config.product_id,
    variant_id: config.variant_id,
    rate_date: activeRates?.date || '',
    gold_rate_999: activeRates?.rawRates.gold999 || 0,
    silver_rate_999: activeRates?.rawRates.silver999 || 0,
    purity: result.metal.purity || '',
    metal_rate_used: result.metal.daily_rate,
    metal_weight: result.metal.weight_g,
    wastage: result.wastage.cost,
    making_charge: result.making_charge.cost,
    stone_cost: result.stone_cost,
    other_cost: result.other_cost,
    margin: result.margin,
    discount: result.discount,
    gst: result.gst,
    final_price: result.final_price,
    updated_at: new Date().toISOString()
  });

  return result;
}

/**
 * This function fetches all variants that have custom_pricing metafields set and auto_pricing_enabled = true.
 * In a real application, you might sync these from webhooks or poll Shopify.
 * We'll use GraphQL to fetch products with custom_pricing namespace.
 */
export async function getAutoPricedVariantsConfig(): Promise<ProductPricingConfig[]> {
  // Real Implementation:
  // Use Shopify Admin GraphQL to query products with custom_pricing metafields.
  // For each variant, build the ProductPricingConfig.
  
  console.log('[ShopifyUpdater] Fetching products with auto_pricing_enabled...');
  // This is a placeholder for the actual GraphQL fetch of variants
  // In production, we'd paginate through products and variants.
  
  return []; 
}

/**
 * Bulk reprice all auto-enabled products safely.
 */
export async function repriceAllProducts() {
  console.log('[ShopifyUpdater] Starting bulk reprice of all auto-enabled products.');
  try {
    const configs = await getAutoPricedVariantsConfig();
    const enabledConfigs = configs.filter(c => c.auto_pricing_enabled);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    
    for (const config of enabledConfigs) {
      processed++;
      try {
        await repriceVariant(config);
        success++;
      } catch (err: any) {
        failed++;
        console.error(`[ShopifyUpdater] Failed to update variant ${config.variant_id}:`, err.message);
      }
      
      // Delay to respect Shopify API rate limits (e.g., 500ms between calls)
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`[ShopifyUpdater] Bulk repricing complete. Processed: ${processed}, Success: ${success}, Failed: ${failed}`);
    return { processed, success, failed };
  } catch (err: any) {
    console.error('[ShopifyUpdater] Bulk repricing failed:', err);
    throw err;
  }
}
