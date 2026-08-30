import { ProductPricingConfig, calculateProductPricing, logPricingHistory, PricingResult } from './productPricingEngine';
import { getActiveRates } from './metalRatesScheduler';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
// Needs Admin API Token to update variants (Storefront API is read-only)
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01'; // Using stable version

async function shopifyAdminGraphQL(query: string, variables: any = {}) {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error('Shopify Admin credentials (SHOPIFY_ADMIN_ACCESS_TOKEN) are not configured in .env');
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
 * Updates the global shop metafields with the daily metal rates so they can be viewed in Shopify Admin.
 */
export async function updateShopMetalRates(rates: ReturnType<typeof getActiveRates>) {
  if (!rates || rates.status !== 'success') return false;

  console.log('[ShopifyUpdater] Pushing daily metal rates to Shopify Shop Metafields...');

  // 1. Get the Shop ID
  const shopQuery = `query { shop { id } }`;
  const shopData = await shopifyAdminGraphQL(shopQuery);
  const shopId = shopData?.shop?.id;

  if (!shopId) throw new Error('Could not retrieve Shop ID from Shopify.');

  // 2. Set the Metafields
  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    metafields: [
      {
        ownerId: shopId,
        namespace: "custom",
        key: "daily_gold_rate",
        type: "number_decimal",
        value: rates.rawRates.gold999.toString()
      },
      {
        ownerId: shopId,
        namespace: "custom",
        key: "daily_silver_rate",
        type: "number_decimal",
        value: rates.rawRates.silver999.toString()
      },
      {
        ownerId: shopId,
        namespace: "custom",
        key: "rates_updated_at",
        type: "single_line_text_field",
        value: rates.date
      }
    ]
  };

  const data = await shopifyAdminGraphQL(mutation, variables);
  if (data?.metafieldsSet?.userErrors?.length > 0) {
    console.error('[ShopifyUpdater] Failed to set shop metafields:', data.metafieldsSet.userErrors);
    return false;
  }

  console.log('[ShopifyUpdater] Successfully pushed daily metal rates to Shopify Shop Metafields.');
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
    making_charge: result.making_charge,
    tax: result.tax,
    final_price: result.final_price,
    updated_at: new Date().toISOString()
  });

  return result;
}

/**
 * Fetches all products and their variants with required custom metafields.
 */
export async function getAutoPricedVariantsConfig(): Promise<ProductPricingConfig[]> {
  console.log('[ShopifyUpdater] Fetching products for bulk pricing from Shopify Admin API...');
  
  if (!SHOPIFY_ADMIN_TOKEN) {
    console.warn('[ShopifyUpdater] Missing SHOPIFY_ADMIN_ACCESS_TOKEN. Cannot fetch products.');
    return [];
  }

  const query = `
    query getProductsWithMetafields($cursor: String) {
      products(first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            metal: metafield(namespace: "custom", key: "metal") { value }
            purity: metafield(namespace: "custom", key: "purity") { value }
            weight: metafield(namespace: "custom", key: "weight") { value }
            making_charge: metafield(namespace: "custom", key: "making_charge") { value }
            tax: metafield(namespace: "custom", key: "tax") { value }
            variants(first: 100) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  let hasNextPage = true;
  let cursor = null;
  const configs: ProductPricingConfig[] = [];

  while (hasNextPage) {
    try {
      const data = await shopifyAdminGraphQL(query, { cursor });
      const products = data?.products?.edges || [];
      
      for (const { node: product } of products) {
        if (!product.metal?.value || !product.purity?.value || !product.weight?.value) {
          continue; // Skip products without base pricing data
        }

        // Shopify weight metafield might be a list or a string. Parse it safely.
        let weightStr = product.weight.value;
        if (weightStr.startsWith('[')) {
          const arr = JSON.parse(weightStr);
          weightStr = arr.length > 0 ? arr[0] : '0';
        }
        
        let metalWeight = parseFloat(weightStr);
        if (isNaN(metalWeight)) metalWeight = 0;
        
        const makingCharge = product.making_charge?.value ? parseFloat(product.making_charge.value) : 0;
        const tax = product.tax?.value ? parseFloat(product.tax.value) : 0;

        for (const { node: variant } of product.variants.edges) {
          configs.push({
            product_id: product.id,
            variant_id: variant.id,
            metal_type: product.metal.value,
            metal_purity: product.purity.value,
            metal_weight_g: metalWeight,
            making_charge: makingCharge,
            tax: tax
          });
        }
      }

      hasNextPage = data?.products?.pageInfo?.hasNextPage;
      cursor = data?.products?.pageInfo?.endCursor;
    } catch (err) {
      console.error('[ShopifyUpdater] Failed to fetch products:', err);
      break;
    }
  }

  console.log(`[ShopifyUpdater] Found ${configs.length} variants eligible for repricing.`);
  return configs;
}

/**
 * Bulk reprice all products safely.
 */
export async function repriceAllProducts() {
  console.log('[ShopifyUpdater] Starting bulk reprice of all products.');
  try {
    const configs = await getAutoPricedVariantsConfig();
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    
    for (const config of configs) {
      processed++;
      try {
        await repriceVariant(config);
        success++;
      } catch (err: any) {
        failed++;
        console.error(`[ShopifyUpdater] Failed to update variant ${config.variant_id}:`, err.message);
      }
      
      // Delay to respect Shopify API rate limits
      await new Promise(r => setTimeout(r, 600));
    }
    
    console.log(`[ShopifyUpdater] Bulk repricing complete. Processed: ${processed}, Success: ${success}, Failed: ${failed}`);
    return { processed, success, failed };
  } catch (err: any) {
    console.error('[ShopifyUpdater] Bulk repricing failed:', err);
    throw err;
  }
}
