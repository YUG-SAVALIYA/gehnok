/**
 * GEHNOK Shopify Headless Integration
 * Shopify Storefront API — TypeScript type definitions
 * All types mirror the Shopify Storefront API GraphQL schema.
 */

// ─── Primitive Shopify Types ────────────────────────────────────────────────

export interface ShopifyMoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  id?: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ShopifyConnection<T> {
  edges: Array<{
    node: T;
    cursor?: string;
  }>;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

// ─── Metafield ──────────────────────────────────────────────────────────────

export interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
  reference?: {
    mediaContentType?: string;
    image?: ShopifyImage;
  };
}

// ─── Product Variant ─────────────────────────────────────────────────────────

export interface ShopifyProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: ShopifyMoneyV2;
  compareAtPrice?: ShopifyMoneyV2;
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: ShopifyImage;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: ShopifyMoneyV2;
    maxVariantPrice: ShopifyMoneyV2;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyMoneyV2;
    maxVariantPrice: ShopifyMoneyV2;
  };
  images: ShopifyConnection<ShopifyImage>;
  media?: ShopifyConnection<{
    mediaContentType: string;
    sources?: Array<{ url: string; format: string }>;
    embeddedUrl?: string;
  }>;
  variants: ShopifyConnection<ShopifyProductVariant>;
  options?: Array<{
    name: string;
    optionValues: Array<{
      name: string;
      swatch?: { color: string } | null;
    }>;
  }>;
  /** Metafields keyed by namespace.key  */
  craft_story?: ShopifyMetafield;
  artisan_name?: ShopifyMetafield;
  certificate?: ShopifyMetafield;
  care_guide?: ShopifyMetafield;
  material_origin?: ShopifyMetafield;
  gemstone?: ShopifyMetafield;
  metal?: ShopifyMetafield;
  purity?: ShopifyMetafield;
  hallmark?: ShopifyMetafield;
  editorial_story?: ShopifyMetafield;
  artisan_hours?: ShopifyMetafield;
  gemstone_type?: ShopifyMetafield;
  gemstone_cut?: ShopifyMetafield;
  gemstone_carat?: ShopifyMetafield;
  gemstone_clarity?: ShopifyMetafield;
  gemstone_color?: ShopifyMetafield;
  craftsmanship_techniques?: ShopifyMetafield;
  delivery_info?: ShopifyMetafield;
  returns_info?: ShopifyMetafield;
  reviews?: ShopifyMetafield;
  rating?: ShopifyMetafield;
  ratingCount?: ShopifyMetafield;
  seo: {
    title?: string;
    description?: string;
  };
}

// ─── Collection ──────────────────────────────────────────────────────────────

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: ShopifyImage;
  products: ShopifyConnection<ShopifyProduct>;
  seo?: {
    title?: string;
    description?: string;
  };
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    sku?: string;
    price: ShopifyMoneyV2;
    compareAtPrice?: ShopifyMoneyV2;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
    image?: ShopifyImage;
    product: {
      id: string;
      handle: string;
      title: string;
    };
  };
  cost: {
    totalAmount: ShopifyMoneyV2;
    subtotalAmount: ShopifyMoneyV2;
    amountPerQuantity: ShopifyMoneyV2;
    compareAtAmountPerQuantity?: ShopifyMoneyV2;
  };
  attributes?: Array<{
    key: string;
    value: string;
  }>;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopifyConnection<ShopifyCartLine>;
  cost: {
    totalAmount: ShopifyMoneyV2;
    subtotalAmount: ShopifyMoneyV2;
    totalTaxAmount?: ShopifyMoneyV2;
    totalDutyAmount?: ShopifyMoneyV2;
  };
  discountCodes: Array<{
    code: string;
    applicable: boolean;
  }>;
  note?: string;
  attributes?: Array<{
    key: string;
    value: string;
  }>;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface ShopifyCustomerAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

export interface ShopifyOrder {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: ShopifyMoneyV2;
  lineItems: ShopifyConnection<{
    title: string;
    quantity: number;
    variant?: {
      price: ShopifyMoneyV2;
      image?: ShopifyImage;
    };
  }>;
}

export interface ShopifyCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  phone?: string;
  tags: string[];
  defaultAddress?: ShopifyCustomerAddress;
  addresses: ShopifyConnection<ShopifyCustomerAddress>;
  orders: ShopifyConnection<ShopifyOrder>;
}

export interface ShopifyCustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface ShopifyPredictiveSearchResult {
  products: ShopifyProduct[];
  collections: ShopifyCollection[];
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ShopifyApiResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

// ─── Internal App Types (Normalized) ────────────────────────────────────────

/**
 * Normalized cart representation used by the frontend.
 * Bridges Shopify cart data with the existing Cart UI component props.
 */
export interface NormalizedCart {
  shopifyCartId: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: NormalizedCartLine[];
  subtotal: string;
  total: string;
  currency: string;
  discountCodes: string[];
}

export interface NormalizedCartLine {
  lineId: string;
  variantId: string;
  productId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  quantity: number;
  price: number; // numeric, for formatting
  compareAtPrice?: number;
  image?: string;
  selectedOptions: Array<{ name: string; value: string }>;
  /** Mapped to the legacy CartItem shape for Cart.tsx compatibility */
  selectedMetal?: string;
  selectedSize?: string;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errors?: Array<{ message: string }>
  ) {
    super(message);
    this.name = 'ShopifyApiError';
  }
}
