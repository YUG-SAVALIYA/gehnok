/**
 * GEHNOK Shopify Headless Integration
 * Shopify → App type mappers.
 *
 * Converts raw Shopify API responses into the existing Product/CartItem
 * types already used throughout the frontend — ensuring zero component changes.
 *
 * FALLBACK STRATEGY: Every field falls back to a sensible default if the
 * corresponding Shopify metafield/field is absent. This allows the app to
 * function gracefully during the Shopify setup phase.
 */

import { Product, CartItem, GemstoneDetails, CraftsmanshipStory } from '../types';
import {
  ShopifyProduct,
  ShopifyCartLine,
  NormalizedCart,
  NormalizedCartLine,
  ShopifyCart,
  ShopifyMetafield,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely read a metafield value as a string.
 */
function metaValue(metafield: ShopifyMetafield | null | undefined): string {
  return metafield?.value ?? '';
}

/**
 * Safely read a metafield value as a number.
 */
function metaNumber(metafield: ShopifyMetafield | null | undefined, fallback = 0): number {
  const v = metafield?.value;
  if (!v) return fallback;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse a metafield JSON list. Returns empty array on failure.
 */
function metaJsonList(
  metafield: ShopifyMetafield | null | undefined,
  fallback: string[] = []
): string[] {
  try {
    const v = metafield?.value;
    if (!v) return fallback;
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Convert Shopify price string + currency to a numeric INR value.
 * If the store uses INR, amount is used directly.
 * If USD, a rough conversion is applied (update rate as needed).
 */
function toINR(amount: string, currencyCode: string): number {
  const numeric = parseFloat(amount);
  if (isNaN(numeric)) return 0;
  if (currencyCode === 'INR') return Math.round(numeric);
  if (currencyCode === 'USD') return Math.round(numeric * 84); // ~84 INR per USD
  return Math.round(numeric); // fallback
}

/**
 * Derive the Gehnok collection category from Shopify title, productType, or tags.
 */
function deriveCollection(
  title: string,
  productType: string,
  tags: string[]
): Product['collection'] {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('earring') || titleLower.includes('stud') || titleLower.includes('drop')) return 'Earrings';
  if (titleLower.includes('necklace') || titleLower.includes('pendant') || titleLower.includes('collar') || (titleLower.includes('charm') && !titleLower.includes('bracelet'))) return 'Necklaces';
  // Check for ring before cuff/bracelet to prevent "Cuff Ring" from becoming a bracelet
  if (titleLower.includes('ring') && !titleLower.includes('earring')) return 'Rings';
  if (titleLower.includes('bracelet') || titleLower.includes('cuff') || titleLower.includes('bangle')) return 'Bracelets';

  const lower = productType.toLowerCase();
  if (lower.includes('earring') || lower.includes('stud') || lower.includes('drop')) return 'Earrings';
  if (lower.includes('necklace') || lower.includes('pendant') || lower.includes('collar') || (lower.includes('charm') && !lower.includes('bracelet'))) return 'Necklaces';
  if (lower.includes('ring') && !lower.includes('earring')) return 'Rings';
  if (lower.includes('bracelet') || lower.includes('cuff') || lower.includes('bangle')) return 'Bracelets';
  if (lower.includes('bespoke') || lower.includes('custom')) return 'Bespoke';

  // Fallback: check tags
  // We check for earrings, necklaces, bracelets BEFORE rings because "ring" is spammed on everything
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes('earring') || t.includes('stud') || t.includes('earing')) return 'Earrings';
    if (t.includes('necklace') || t.includes('pendant')) return 'Necklaces';
    if (t.includes('bracelet') || t.includes('cuff')) return 'Bracelets';
    if (t.includes('ring')) return 'Rings';
  }

  return 'Rings'; // safe fallback
}

/**
 * Derive the metal type from metafield or variant options.
 */
function deriveMetal(
  metalMeta: ShopifyMetafield | null | undefined,
  variantOptions: Array<{ name: string; value: string }>
): Product['metal'] {
  const rawMetal = metaValue(metalMeta)
    || variantOptions.find(o => o.name.toLowerCase() === 'material' || o.name.toLowerCase() === 'metal')?.value
    || '';

  const lower = rawMetal.toLowerCase();
  if (lower.includes('platinum') || lower.includes('pt950') || lower.includes('pt 950')) return 'Platinum';
  if (lower.includes('rose')) return 'Rose Gold';
  if (lower.includes('amethyst') || lower.includes('purple')) return 'Amethyst Purple Gold';
  return 'Champagne Gold'; // default
}

/**
 * Derive purity from metafield or product type.
 */
function derivePurity(
  purityMeta: ShopifyMetafield | null | undefined,
  metal: Product['metal']
): Product['purity'] {
  const raw = metaValue(purityMeta).toLowerCase();
  if (raw.includes('950') || raw.includes('platinum')) return '950 Platinum';
  if (metal === 'Platinum') return '950 Platinum';
  return '18k';
}

/**
 * Build a GemstoneDetails object from Shopify metafields.
 * Returns null if no gemstone data is present.
 */
function deriveGemstone(product: ShopifyProduct): GemstoneDetails | null {
  const gemstoneType = metaValue(product.gemstone_type) || metaValue(product.gemstone);
  if (!gemstoneType) return null;

  return {
    type: gemstoneType,
    cut: metaValue(product.gemstone_cut) || 'Round Brilliant',
    carat: metaNumber(product.gemstone_carat, 1.0),
    clarity: metaValue(product.gemstone_clarity) || 'VVS1',
    color: metaValue(product.gemstone_color) || 'Colorless',
  };
}

/**
 * Build a CraftsmanshipStory from Shopify metafields.
 */
function deriveCraftsmanship(product: ShopifyProduct): CraftsmanshipStory {
  return {
    inspiration: metaValue(product.editorial_story) || product.description.split('.')[0] || 'Forged in our private atelier.',
    artisanHours: metaNumber(product.artisan_hours, 48),
    techniques: metaJsonList(product.craftsmanship_techniques, [
      'Hand finishing',
      'Precision stone setting',
      'Mirror burnishing',
    ]),
  };
}

// ─── Main Mapper ──────────────────────────────────────────────────────────────

/**
 * Maps a raw Shopify product to the app's existing Product type.
 * This is the central bridge function — all components use Product.
 */
export function mapShopifyProductToProduct(shopifyProduct: ShopifyProduct): Product {
  const firstVariant = shopifyProduct.variants.edges[0]?.node;
  const variantOptions = firstVariant?.selectedOptions ?? [];

  const metal = deriveMetal(shopifyProduct.metal, variantOptions);
  const purity = derivePurity(shopifyProduct.purity, metal);
  const collection = deriveCollection(shopifyProduct.title, shopifyProduct.productType, shopifyProduct.tags);
  const gemstone = deriveGemstone(shopifyProduct);
  const craftsmanship = deriveCraftsmanship(shopifyProduct);

  const priceAmount = firstVariant?.price.amount
    ?? shopifyProduct.priceRange.minVariantPrice.amount;
  const priceCurrency = firstVariant?.price.currencyCode
    ?? shopifyProduct.priceRange.minVariantPrice.currencyCode;
  const priceINR = toINR(priceAmount, priceCurrency);

  const images = shopifyProduct.images.edges.map(e => e.node.url);

  const careInstructionsRaw = metaValue(shopifyProduct.care_guide);
  let careInstructions: string[] = [];
  if (careInstructionsRaw) {
    try {
      const parsed = JSON.parse(careInstructionsRaw);
      careInstructions = Array.isArray(parsed) ? parsed : [careInstructionsRaw];
    } catch {
      careInstructions = careInstructionsRaw.split('\n').filter(Boolean);
    }
  }

  // Parse reviews
  const reviewsRaw = metaValue(shopifyProduct.reviews);
  let reviews: any[] = [];
  if (reviewsRaw) {
    try {
      reviews = JSON.parse(reviewsRaw);
    } catch {
      reviews = [];
    }
  }

  // Map variants
  const variants = shopifyProduct.variants.edges.map(e => ({
    id: e.node.id,
    title: e.node.title,
    sku: e.node.sku,
    availableForSale: e.node.availableForSale,
    price: toINR(e.node.price.amount, e.node.price.currencyCode),
    compareAtPrice: e.node.compareAtPrice ? toINR(e.node.compareAtPrice.amount, e.node.compareAtPrice.currencyCode) : undefined,
    selectedOptions: e.node.selectedOptions,
    image: e.node.image?.url
  }));

  // Map media
  const media = shopifyProduct.media?.edges.map(e => ({
    mediaContentType: e.node.mediaContentType,
    url: e.node.sources?.[0]?.url,
    format: e.node.sources?.[0]?.format,
    embeddedUrl: e.node.embeddedUrl
  })) || [];

  return {
    id: shopifyProduct.handle, // use handle as stable ID for UI (matches existing pattern)
    name: shopifyProduct.title,
    collection,
    price: priceINR,
    metal,
    purity,
    images,
    description: shopifyProduct.description.replace(/Your browser does not support.*?(\.|<\/p>|<br>|$)/gi, '').trim(),
    descriptionHtml: shopifyProduct.descriptionHtml,
    story: metaValue(shopifyProduct.craft_story) || shopifyProduct.description.replace(/Your browser does not support.*?(\.|<\/p>|<br>|$)/gi, '').trim(),
    gemstone,
    craftsmanship,
    certification: metaValue(shopifyProduct.certificate) || '',
    hallmark: metaValue(shopifyProduct.hallmark) || '',
    careInstructions,
    deliveryInfo: metaValue(shopifyProduct.delivery_info) || '',
    returnsInfo: metaValue(shopifyProduct.returns_info) || '',
    variants,
    options: shopifyProduct.options,
    reviews: reviews.length > 0 ? reviews : undefined,
    rating: shopifyProduct.rating?.value ? Number(shopifyProduct.rating.value) : undefined,
    ratingCount: shopifyProduct.ratingCount?.value ? Number(shopifyProduct.ratingCount.value) : undefined,
    media: media.length > 0 ? media : undefined
  };
}

/**
 * Maps an array of Shopify products to the app Product type.
 */
export function mapShopifyProducts(shopifyProducts: ShopifyProduct[]): Product[] {
  return shopifyProducts.map(mapShopifyProductToProduct);
}

// ─── Cart Mapper ──────────────────────────────────────────────────────────────

/**
 * Normalize a Shopify cart line to NormalizedCartLine.
 * Extracts metal/size from selectedOptions for Cart.tsx compatibility.
 */
function mapCartLine(line: ShopifyCartLine): NormalizedCartLine {
  const metalOption = line.merchandise.selectedOptions.find(
    o => o.name.toLowerCase() === 'material' || o.name.toLowerCase() === 'metal'
  )?.value;
  const sizeOption = line.merchandise.selectedOptions.find(
    o => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'ring size'
  )?.value;

  const priceAmount = line.merchandise.price.amount;
  const priceCurrency = line.merchandise.price.currencyCode;

  return {
    lineId: line.id,
    variantId: line.merchandise.id,
    productId: line.merchandise.product.id,
    productHandle: line.merchandise.product.handle,
    title: line.merchandise.product.title,
    variantTitle: line.merchandise.title,
    quantity: line.quantity,
    price: toINR(priceAmount, priceCurrency),
    compareAtPrice: line.merchandise.compareAtPrice
      ? toINR(line.merchandise.compareAtPrice.amount, line.merchandise.compareAtPrice.currencyCode)
      : undefined,
    image: line.merchandise.image?.url,
    selectedOptions: line.merchandise.selectedOptions,
    selectedMetal: metalOption || 'Champagne Gold',
    selectedSize: sizeOption || 'Standard',
  };
}

/**
 * Map a full Shopify Cart to our NormalizedCart.
 */
export function mapShopifyCart(shopifyCart: ShopifyCart): NormalizedCart {
  const lines = shopifyCart.lines.edges.map(e => mapCartLine(e.node));
  const currency = shopifyCart.cost.totalAmount.currencyCode;

  return {
    shopifyCartId: shopifyCart.id,
    checkoutUrl: shopifyCart.checkoutUrl,
    totalQuantity: shopifyCart.totalQuantity,
    lines,
    subtotal: shopifyCart.cost.subtotalAmount.amount,
    total: shopifyCart.cost.totalAmount.amount,
    currency,
    discountCodes: shopifyCart.discountCodes
      .filter(d => d.applicable)
      .map(d => d.code),
  };
}

/**
 * Convert a NormalizedCartLine back to the legacy CartItem shape
 * so it can be passed into the existing Cart.tsx component without changes.
 */
export function normalizedLineToLegacyCartItem(
  line: NormalizedCartLine
): CartItem {
  const fakeProduct: Product = {
    id: line.productHandle,
    name: line.title,
    collection: 'Rings', // doesn't matter for Cart.tsx display
    price: line.price,
    metal: (line.selectedMetal || 'Champagne Gold') as Product['metal'],
    purity: '18k',
    images: line.image ? [line.image] : ['/assets/aeterna_gold_band.png'],
    description: '',
    story: '',
    gemstone: null,
    craftsmanship: {
      inspiration: '',
      artisanHours: 0,
      techniques: [],
    },
    certification: '',
    hallmark: '',
    careInstructions: [],
    deliveryInfo: '',
    returnsInfo: '',
  };

  return {
    product: fakeProduct,
    quantity: line.quantity,
    selectedMetal: line.selectedMetal,
    selectedSize: line.selectedSize,
  };
}
