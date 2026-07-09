import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// SHOPIFY STOREFRONT API SERVICE LAYER
// All Shopify credentials are server-side only — never sent to the browser.
// ═══════════════════════════════════════════════════════════════════════════════

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? '';
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-01';

const SHOPIFY_ENABLED = Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_TOKEN);

if (!SHOPIFY_ENABLED) {
  console.warn('[Shopify] Store domain or token not configured. Shopify routes will return 503.');
}

// ─── In-memory cache (5-minute TTL for product/collection data) ──────────────

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}
const shopifyCache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const entry = shopifyCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    shopifyCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlSeconds = 300): void {
  shopifyCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── shopifyFetch: Core Storefront API client ─────────────────────────────────

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  token?: string;      // customer access token for authenticated queries
  retries?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

async function shopifyFetch<T = unknown>(options: ShopifyFetchOptions): Promise<T> {
  const { query, variables = {}, token, retries = 3, cacheKey, cacheTTL = 300 } = options;

  if (!SHOPIFY_ENABLED) {
    throw new Error('Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env');
  }

  // Check cache first (only for GET-like queries, not mutations)
  if (cacheKey) {
    const cached = cacheGet<T>(cacheKey);
    if (cached) return cached;
  }

  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    'Accept': 'application/json',
  };
  if (token) {
    headers['Shopify-Storefront-Buyer-IP'] = ''; // optional: pass real client IP
  }

  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      // Handle rate limiting with exponential backoff
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '1', 10);
        const waitMs = Math.min(retryAfter * 1000, 8000) * Math.pow(2, attempt - 1);
        console.warn(`[Shopify] Rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        console.error(`[Shopify] HTTP ${res.status} from Storefront API:`, body.slice(0, 500));
        throw new Error(`Shopify API HTTP error: ${res.status} — ${body.slice(0, 200)}`);
      }


      const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

      if (json.errors && json.errors.length > 0) {
        const messages = json.errors.map(e => e.message).join('; ');
        throw new Error(`Shopify GraphQL errors: ${messages}`);
      }

      const result = json.data as T;

      // Cache successful results
      if (cacheKey && result) {
        cacheSet(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (err) {
      if (attempt >= retries) throw err;
      const waitMs = 500 * Math.pow(2, attempt - 1);
      console.warn(`[Shopify] Fetch attempt ${attempt} failed. Retrying in ${waitMs}ms...`, err);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw new Error('Shopify fetch failed after all retries');
}

// ─── GraphQL fragments (inline for server-side use) ──────────────────────────

const MONEY_FRAG = `fragment Money on MoneyV2 { amount currencyCode }`;
const IMAGE_FRAG = `fragment Img on Image { id url(transform: { maxWidth: 1200 }) altText width height }`;
const META_FRAG = `fragment Meta on Metafield { id namespace key value type }`;

const VARIANT_FRAG = `
  fragment Variant on ProductVariant {
    id title sku availableForSale
    price { ...Money } compareAtPrice { ...Money }
    selectedOptions { name value }
    image { ...Img }
  }`;

const PRODUCT_FRAG = `
  fragment Prod on Product {
    id handle title description productType vendor tags availableForSale
    priceRange { minVariantPrice { ...Money } maxVariantPrice { ...Money } }
    compareAtPriceRange { minVariantPrice { ...Money } }
    images(first: 250) { edges { node { ...Img } } }
    media(first: 100) {
      edges {
        node {
          mediaContentType
          ... on Video { sources { url format } }
          ... on Model3d { sources { url format } }
          ... on ExternalVideo { embeddedUrl }
        }
      }
    }
    variants(first: 250) { edges { node { ...Variant } } }
    seo { title description }
    descriptionHtml
    options {
      name
      optionValues {
        name
        swatch { color }
      }
    }
    craft_story: metafield(namespace: "custom", key: "craft_story") { ...Meta }
    certificate: metafield(namespace: "custom", key: "certificate") { ...Meta }
    care_guide: metafield(namespace: "custom", key: "care_guide") { ...Meta }
    metal: metafield(namespace: "custom", key: "metal") { ...Meta }
    purity: metafield(namespace: "custom", key: "purity") { ...Meta }
    hallmark: metafield(namespace: "custom", key: "hallmark") { ...Meta }
    editorial_story: metafield(namespace: "custom", key: "editorial_story") { ...Meta }
    artisan_hours: metafield(namespace: "custom", key: "artisan_hours") { ...Meta }
    gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...Meta }
    gemstone_cut: metafield(namespace: "custom", key: "gemstone_cut") { ...Meta }
    gemstone_carat: metafield(namespace: "custom", key: "gemstone_carat") { ...Meta }
    gemstone_clarity: metafield(namespace: "custom", key: "gemstone_clarity") { ...Meta }
    gemstone_color: metafield(namespace: "custom", key: "gemstone_color") { ...Meta }
    craftsmanship_techniques: metafield(namespace: "custom", key: "craftsmanship_techniques") { ...Meta }
    delivery_info: metafield(namespace: "custom", key: "delivery_info") { ...Meta }
    returns_info: metafield(namespace: "custom", key: "returns_info") { ...Meta }
    reviews: metafield(namespace: "custom", key: "reviews") { ...Meta }
  }`;

const CART_LINE_FRAG = `
  fragment CartLine on CartLine {
    id quantity
    merchandise {
      ... on ProductVariant {
        id title sku availableForSale
        price { ...Money } compareAtPrice { ...Money }
        selectedOptions { name value }
        image { ...Img }
        product { id handle title }
      }
    }
    cost { totalAmount { ...Money } subtotalAmount { ...Money } amountPerQuantity { ...Money } }
    attributes { key value }
  }`;

const CART_DATA_FRAG = `
  fragment CartData on Cart {
    id checkoutUrl totalQuantity
    lines(first: 100) { edges { node { ...CartLine } } }
    cost { totalAmount { ...Money } subtotalAmount { ...Money } totalTaxAmount { ...Money } }
    discountCodes { code applicable }
    note
  }`;

const PRODUCT_QUERY_FRAGMENTS = `
  ${MONEY_FRAG}
  ${IMAGE_FRAG}
  ${META_FRAG}
  ${VARIANT_FRAG}
  ${PRODUCT_FRAG}
`;

const CART_QUERY_FRAGMENTS = `
  ${MONEY_FRAG}
  ${IMAGE_FRAG}
  ${CART_LINE_FRAG}
  ${CART_DATA_FRAG}
`;


// ─── Shopify route middleware ─────────────────────────────────────────────────

function shopifyGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!SHOPIFY_ENABLED) {
    return res.status(503).json({
      error: 'Shopify integration not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env'
    });
  }
  next();
}

// ─── Shopify Router ───────────────────────────────────────────────────────────

const shopifyRouter = express.Router();
shopifyRouter.use(shopifyGuard);

/** GET /api/shopify/metaobjects/:type/:handle - fetch metaobject fields */
shopifyRouter.get('/metaobjects/:type/:handle', async (req, res) => {
  try {
    const { type, handle } = req.params;
    const data = await shopifyFetch<{ metaobject: any }>({
      query: `query GetMetaobject($handle: MetaobjectHandleInput!) {
        metaobject(handle: $handle) {
          id
          handle
          type
          fields {
            key
            value
            reference {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
              ... on GenericFile {
                url
              }
            }
          }
        }
      }`,
      variables: { handle: { type, handle } }
    });
    console.log(`[Shopify] Metaobject fetched:`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

/** GET /api/shopify/policies - fetch shop policies */
shopifyRouter.get('/policies', async (req, res) => {
  try {
    const data = await shopifyFetch<{ shop: unknown }>({
      query: `query ShopPolicies {
        shop {
          privacyPolicy { title body }
          shippingPolicy { title body }
          termsOfService { title body }
          refundPolicy { title body }
        }
      }`,
    });
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

const app = express();
const PORT = 3000;

app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════════
// SHOPIFY API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Products ──────────────────────────────────────────────────────────────────

/** GET /api/shopify/products — fetch all products with optional sort/pagination */
shopifyRouter.get('/products', async (req, res) => {
  try {
    const first = Math.min(parseInt(req.query.first as string ?? '50', 10), 250);
    const sortKey = (req.query.sortKey as string) || 'CREATED_AT';
    const reverse = req.query.reverse === 'true';
    const after = req.query.after as string | undefined;

    const cacheKey = `products:${first}:${sortKey}:${reverse}:${after ?? ''}`;
    const data = await shopifyFetch<{ products: { edges: Array<{ cursor: string; node: unknown }>; pageInfo: unknown } }>({
      query: `${PRODUCT_QUERY_FRAGMENTS} query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          pageInfo { hasNextPage endCursor }
          edges { cursor node { ...Prod } }
        }
      }`,
      variables: { first, after: after ?? null, sortKey, reverse },
      cacheKey,
    });

    const products = data.products.edges.map((e: any) => e.node);
    res.json({ products, pageInfo: data.products.pageInfo });
  } catch (err: any) {
    console.error('[Shopify] GET /products error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/shopify/products/:handle — fetch single product */
shopifyRouter.get('/products/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const cacheKey = `product:${handle}`;
    const data = await shopifyFetch<{ product: unknown }>({
      query: `${PRODUCT_QUERY_FRAGMENTS} query Product($handle: String!) { product(handle: $handle) { ...Prod } }`,
      variables: { handle },
      cacheKey,
    });
    if (!data.product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data.product });
  } catch (err: any) {
    console.error('[Shopify] GET /products/:handle error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/shopify/products/:handle/variant — find variant by options */
shopifyRouter.get('/products/:handle/variant', async (req, res) => {
  try {
    const { handle } = req.params;
    const metal = (req.query.metal as string) || '';
    const size = (req.query.size as string) || '';

    const data = await shopifyFetch<{ product: any }>({
      query: `${IMAGE_FRAG} ${MONEY_FRAG} ${VARIANT_FRAG} query ProductVariants($handle: String!) {
        product(handle: $handle) { variants(first: 50) { edges { node { ...Variant } } } }
      }`,
      variables: { handle },
      cacheKey: `variants:${handle}`,
    });

    const variants: any[] = data.product?.variants?.edges?.map((e: any) => e.node) ?? [];
    // Find best matching variant by options
    const match = variants.find(v =>
      v.selectedOptions.some((o: any) =>
        (o.name.toLowerCase().includes('metal') || o.name.toLowerCase().includes('material')) &&
        o.value.toLowerCase().includes(metal.toLowerCase().split(' ')[0])
      )
    ) || variants.find(v =>
      v.selectedOptions.some((o: any) =>
        o.name.toLowerCase().includes('size') && o.value === size
      )
    ) || variants[0];

    res.json({ variantId: match?.id ?? null });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Collections ───────────────────────────────────────────────────────────────

/** GET /api/shopify/collections — list all collections */
shopifyRouter.get('/collections', async (req, res) => {
  try {
    const first = parseInt(req.query.first as string ?? '20', 10);
    const data = await shopifyFetch<{ collections: { edges: unknown[] } }>({
      query: `${IMAGE_FRAG} query Collections($first: Int!) {
        collections(first: $first) {
          edges { node { id handle title description image { ...Img } } }
        }
      }`,
      variables: { first },
      cacheKey: `collections:${first}`,
    });
    const collections = (data.collections.edges as any[]).map(e => e.node);
    res.json({ collections });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/shopify/collections/:handle/products — products in a collection */
shopifyRouter.get('/collections/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const first = Math.min(parseInt(req.query.first as string ?? '50', 10), 250);
    const after = req.query.after as string | undefined;
    const cacheKey = `collection:${handle}:${first}:${after ?? ''}`;

    const data = await shopifyFetch<{ collection: any }>({
      query: `${PRODUCT_QUERY_FRAGMENTS} query Col($handle: String!, $first: Int!, $after: String) {
        collection(handle: $handle) {
          id handle title description
          image { ...Img }
          products(first: $first, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges { cursor node { ...Prod } }
          }
        }
      }`,
      variables: { handle, first, after: after ?? null },
      cacheKey,
    });

    if (!data.collection) return res.status(404).json({ error: 'Collection not found' });
    const products = data.collection.products.edges.map((e: any) => e.node);
    res.json({ collection: data.collection, products, pageInfo: data.collection.products.pageInfo });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Articles / Blogs ────────────────────────────────────────────────────────────

/** GET /api/shopify/articles — fetch recent blog articles */
shopifyRouter.get('/articles', async (req, res) => {
  try {
    const first = parseInt(req.query.first as string ?? '3', 10);
    const data = await shopifyFetch<{ articles: { edges: any[] } }>({
      query: `query Articles($first: Int!) {
        articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
          edges {
            node {
              id
              handle
              title
              publishedAt
              contentHtml
              excerptHtml
              image { url altText }
              authorV2 { name }
              blog { title }
            }
          }
        }
      }`,
      variables: { first },
      cacheKey: `articles:${first}`,
    });
    const articles = data.articles?.edges?.map(e => e.node) || [];
    res.json({ articles });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Search ────────────────────────────────────────────────────────────────────

/** GET /api/shopify/search?q=...&first=10 — full-text product search */
shopifyRouter.get('/search', async (req, res) => {
  try {
    const q = (req.query.q as string ?? '').trim();
    if (!q) return res.json({ products: [] });
    const first = Math.min(parseInt(req.query.first as string ?? '10', 10), 50);

    const data = await shopifyFetch<{ products: { edges: unknown[] } }>({
      query: `${IMAGE_FRAG} ${MONEY_FRAG} ${META_FRAG} ${VARIANT_FRAG}
        query Search($query: String!, $first: Int!) {
          products(query: $query, first: $first) {
            edges { node {
              id handle title description productType vendor tags availableForSale
              priceRange { minVariantPrice { ...Money } }
              images(first: 3) { edges { node { ...Img } } }
              variants(first: 5) { edges { node { ...Variant } } }
              metal: metafield(namespace: "custom", key: "metal") { ...Meta }
              purity: metafield(namespace: "custom", key: "purity") { ...Meta }
              gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...Meta }
            }}
          }
        }`,
      variables: { query: q, first },
    });

    const products = (data.products.edges as any[]).map(e => e.node);
    res.json({ products });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Cart ──────────────────────────────────────────────────────────────────────

/** POST /api/shopify/cart — create a new cart */
shopifyRouter.post('/cart', async (req, res) => {
  try {
    const { lines = [], note, attributes } = req.body;
    const data = await shopifyFetch<{ cartCreate: { cart: unknown; userErrors: unknown[] } }>({
      query: `${CART_QUERY_FRAGMENTS} mutation CreateCart($input: CartInput) {
        cartCreate(input: $input) { cart { ...CartData } userErrors { field message } }
      }`,
      variables: { input: { lines, note, attributes } },
    });

    if (data.cartCreate.userErrors?.length > 0) {
      return res.status(400).json({ error: 'Cart creation failed', userErrors: data.cartCreate.userErrors });
    }
    res.json({ cart: data.cartCreate.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/shopify/cart/:cartId — fetch existing cart */
shopifyRouter.get('/cart/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    const data = await shopifyFetch<{ cart: unknown }>({
      query: `${CART_QUERY_FRAGMENTS} query Cart($cartId: ID!) { cart(id: $cartId) { ...CartData } }`,
      variables: { cartId },
    });
    if (!data.cart) return res.status(404).json({ error: 'Cart not found or expired' });
    res.json({ cart: data.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** POST /api/shopify/cart/:cartId/lines — add items to cart */
shopifyRouter.post('/cart/:cartId/lines', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { lines } = req.body;
    if (!lines?.length) return res.status(400).json({ error: 'lines required' });

    const data = await shopifyFetch<{ cartLinesAdd: { cart: unknown; userErrors: unknown[] } }>({
      query: `${CART_QUERY_FRAGMENTS} mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartData } userErrors { field message } }
      }`,
      variables: { cartId, lines },
    });

    if ((data.cartLinesAdd.userErrors as any[])?.length > 0) {
      return res.status(400).json({ error: 'Add to cart failed', userErrors: data.cartLinesAdd.userErrors });
    }
    res.json({ cart: data.cartLinesAdd.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** PATCH /api/shopify/cart/:cartId/lines/:lineId — update line quantity */
shopifyRouter.patch('/cart/:cartId/lines/:lineId', async (req, res) => {
  try {
    const { cartId, lineId } = req.params;
    const { quantity } = req.body;
    if (typeof quantity !== 'number') return res.status(400).json({ error: 'quantity required' });

    const data = await shopifyFetch<{ cartLinesUpdate: { cart: unknown; userErrors: unknown[] } }>({
      query: `${CART_QUERY_FRAGMENTS} mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartData } userErrors { field message } }
      }`,
      variables: { cartId, lines: [{ id: lineId, quantity }] },
    });

    res.json({ cart: data.cartLinesUpdate.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** DELETE /api/shopify/cart/:cartId/lines/:lineId — remove a line */
shopifyRouter.delete('/cart/:cartId/lines/:lineId', async (req, res) => {
  try {
    const { cartId, lineId } = req.params;
    const data = await shopifyFetch<{ cartLinesRemove: { cart: unknown; userErrors: unknown[] } }>({
      query: `${CART_QUERY_FRAGMENTS} mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartData } userErrors { field message } }
      }`,
      variables: { cartId, lineIds: [lineId] },
    });

    res.json({ cart: data.cartLinesRemove.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** POST /api/shopify/cart/:cartId/discount — apply discount codes */
shopifyRouter.post('/cart/:cartId/discount', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { discountCodes } = req.body;
    if (!Array.isArray(discountCodes)) return res.status(400).json({ error: 'discountCodes array required' });

    const data = await shopifyFetch<{ cartDiscountCodesUpdate: { cart: unknown; userErrors: unknown[] } }>({
      query: `${CART_QUERY_FRAGMENTS} mutation Discount($cartId: ID!, $discountCodes: [String!]!) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) { cart { ...CartData } userErrors { field message } }
      }`,
      variables: { cartId, discountCodes },
    });

    res.json({ cart: data.cartDiscountCodesUpdate.cart });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Customer ──────────────────────────────────────────────────────────────────

/** POST /api/shopify/customer/register — create new customer account */
shopifyRouter.post('/customer/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const data = await shopifyFetch<{ customerCreate: { customer: unknown; customerUserErrors: Array<{ message: string; field: string }> } }>({
      query: `mutation Register($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer { id firstName lastName email }
          customerUserErrors { field code message }
        }
      }`,
      variables: { input: { firstName, lastName, email, password, acceptsMarketing: false } },
    });

    if (data.customerCreate.customerUserErrors?.length > 0) {
      const msg = data.customerCreate.customerUserErrors[0]?.message ?? 'Registration failed';
      return res.status(400).json({ error: msg });
    }
    res.json({ customer: data.customerCreate.customer });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** POST /api/shopify/customer/login — obtain access token */
shopifyRouter.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const data = await shopifyFetch<{ customerAccessTokenCreate: { customerAccessToken: { accessToken: string; expiresAt: string } | null; customerUserErrors: Array<{ message: string }> } }>({
      query: `mutation Login($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { field code message }
        }
      }`,
      variables: { input: { email, password } },
    });

    const tokenData = data.customerAccessTokenCreate.customerAccessToken;
    if (!tokenData) {
      const msg = data.customerAccessTokenCreate.customerUserErrors[0]?.message ?? 'Invalid credentials';
      return res.status(401).json({ error: msg });
    }
    res.json({ accessToken: tokenData.accessToken, expiresAt: tokenData.expiresAt });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** DELETE /api/shopify/customer/logout — revoke access token */
shopifyRouter.delete('/customer/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(400).json({ error: 'Token required' });

    await shopifyFetch({
      query: `mutation Logout($customerAccessToken: String!) {
        customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
          deletedAccessToken userErrors { field message }
        }
      }`,
      variables: { customerAccessToken: token },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** GET /api/shopify/customer — fetch authenticated customer profile */
shopifyRouter.get('/customer', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authorization token required' });

    const data = await shopifyFetch<{ customer: unknown }>({
      query: `
        fragment Addr on MailingAddress { id firstName lastName address1 city country zip phone }
        fragment Ord on Order {
          id orderNumber processedAt financialStatus fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 10) {
            edges { node { title quantity variant { price { amount currencyCode } } } }
          }
        }
        query Customer($token: String!) {
          customer(customerAccessToken: $token) {
            id firstName lastName displayName email phone tags
            defaultAddress { ...Addr }
            addresses(first: 10) { edges { node { ...Addr } } }
            orders(first: 20, sortKey: PROCESSED_AT, reverse: true) { edges { node { ...Ord } } }
          }
        }`,
      variables: { token },
    });

    if (!data.customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: data.customer });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

/** POST /api/shopify/customer/recover — trigger password reset email */
shopifyRouter.post('/customer/recover', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await shopifyFetch({
      query: `mutation Recover($email: String!) {
        customerRecover(email: $email) { customerUserErrors { field code message } }
      }`,
      variables: { email },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── Register the Shopify router ───────────────────────────────────────────────

app.use('/api/shopify', shopifyRouter);

// ─── Clear Shopify cache (admin utility) ─────────────────────────────────────

app.post('/api/shopify/cache/clear', (req, res) => {
  shopifyCache.clear();
  console.log('[Shopify] Cache cleared.');
  res.json({ success: true, message: 'Shopify cache cleared' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING ATELIER APIs (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory databases for the Digital Atelier session
const appointments: any[] = [
  {
    id: 'appt-1',
    clientName: 'Savaliya Yug',
    clientEmail: 'savaliyayug85@gmail.com',
    date: '2026-07-15',
    time: '14:00',
    consultationType: 'Bespoke Design',
    notes: 'Inquiring about a custom purple-gold setting for an heirloom marquise sapphire.',
    status: 'Scheduled'
  }
];

const clientProfile = {
  name: 'Savaliya Yug',
  email: 'savaliyayug85@gmail.com',
  tier: 'Private Client',
  memberSince: '2026',
  wishlist: ['aeterna-gold-band', 'sirens-tear-pendant']
};

// API: Appointments
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { clientName, clientEmail, date, time, consultationType, notes } = req.body;
  if (!clientName || !clientEmail || !date || !time || !consultationType) {
    return res.status(400).json({ error: 'Missing required consultation fields' });
  }
  const newAppt = {
    id: `appt-${Date.now()}`,
    clientName,
    clientEmail,
    date,
    time,
    consultationType,
    notes: notes || '',
    status: 'Scheduled'
  };
  appointments.push(newAppt);
  res.status(201).json(newAppt);
});

// API: Client Profile
app.get('/api/profile', (req, res) => {
  res.json(clientProfile);
});

// API: Contact us ledger
const contacts: any[] = [];

app.post('/api/contact', (req, res) => {
  const { name, email, subject, productId, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing name, email, or message' });
  }
  const newContact = {
    id: `contact-${Date.now()}`,
    name,
    email,
    subject,
    productId: productId || '',
    message,
    timestamp: new Date().toISOString()
  };
  contacts.push(newContact);
  console.log('Received correspondence from client:', newContact);
  res.status(201).json({ success: true, contact: newContact });
});

app.post('/api/profile/wishlist', (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID required' });
  }
  if (!clientProfile.wishlist.includes(productId)) {
    clientProfile.wishlist.push(productId);
  }
  res.json(clientProfile);
});

app.delete('/api/profile/wishlist/:id', (req, res) => {
  const { id } = req.params;
  clientProfile.wishlist = clientProfile.wishlist.filter(item => item !== id);
  res.json(clientProfile);
});

// Fallback elegant responses for the AI Concierge when API key is missing
const SIMULATED_CONCIERGE_RESPONSES = [
  {
    keywords: ['anniversary', 'wedding', 'marriage', 'celebrate'],
    response: "For a moment as permanent as an anniversary, we suggest a piece that carries both eternity and silence. The Aeterna Gold Band represents the infinite, hand-beaded with micro-pave diamonds that reflect candlelight like quiet memories. Alternatively, if your journey is marked by singular brilliance, The Solitaire Luminary, suspended on its delicate platinum claw setting, elevates a flawless 1.8-carat diamond to catch every fleeting fraction of light.",
    recommendedProductIds: ['aeterna-gold-band', 'solitaire-luminary']
  },
  {
    keywords: ['ring', 'finger', 'band'],
    response: "A ring is not merely an ornament; it is a seal of intent. Within our chambers, we offer the Aeterna Gold Band, carrying the subtle warmth of our custom 18k Champagne Gold. For a deeper, more royal mystery, the Amethyst Sovereign cradles a deep violet cushion-cut 4.5-carat stone inside our proprietary Amethyst Purple Gold alloy.",
    recommendedProductIds: ['aeterna-gold-band', 'amethyst-sovereign']
  },
  {
    keywords: ['necklace', 'pendant', 'collar', 'neck'],
    response: "To adorn the collarbone is to frame the posture of the wearer. The Siren's Tear Pendant features a lagoon-blue Paraiba-type tourmaline on an ultra-fine Champagne Gold thread. For higher evenings, the Plum Velvet Collar rests interlocking gold mesh plates against the neck, embedded with channel-set baguette amethysts.",
    recommendedProductIds: ['sirens-tear-pendant', 'plum-velvet-collar']
  },
  {
    keywords: ['green', 'emerald', 'forest'],
    response: "Green is the hue of life and sanctuary. Our Elysian Emerald Studs mount rare hexagonal-cut Zambian emeralds within thin bezel walls of Champagne Gold, allowing you to carry a private greenhouse of natural garden inclusions with you.",
    recommendedProductIds: ['elysian-studs']
  }
];

// API: Concierge
app.post('/api/concierge', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Client message is required' });
  }

  // Elegant fallback simulator
  const normalizedMessage = message.toLowerCase();
  let selectedSim = SIMULATED_CONCIERGE_RESPONSES.find(sim => 
    sim.keywords.some(keyword => normalizedMessage.includes(keyword))
  );

  if (!selectedSim) {
    selectedSim = {
      keywords: [],
      response: "Welcome to the GEHNOK private chambers. It is an honor to guide your gaze. Tell me of the occasion you seek to mark, the metals that speak to your touch, or whether you desire the warm embrace of our hand-formulated Champagne Gold or the crystalline permanence of Platinum.",
      recommendedProductIds: ['aeterna-gold-band', 'atelier-cuff']
    };
  }

  // Add a slight delay to mimic boutique reflection
  await new Promise(resolve => setTimeout(resolve, 1000));
  return res.json(selectedSim);
});

// Configure Vite or Serve static site
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`GEHNOK Digital Atelier backend running on http://localhost:${PORT}`);
  });
}

startServer();
