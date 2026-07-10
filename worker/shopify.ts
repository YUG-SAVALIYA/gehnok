export type Env = {
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_API_VERSION?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
};

type ShopifyData = Record<string, unknown>;

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type ShopifyUserError = {
  field?: string[] | string | null;
  code?: string | null;
  message?: string | null;
};

type ShopifyWarning = {
  code?: string | null;
  target?: string | null;
  message?: string | null;
};

const API_PREFIX = "/api/shopify";

const ALLOWED_ORIGINS = new Set([
  "https://gehnok.com",
  "https://www.gehnok.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const CORS_BASE_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
};

const MONEY_FRAG = `fragment Money on MoneyV2 { amount currencyCode }`;
const IMAGE_FRAG =
  `fragment Img on Image { id url(transform: { maxWidth: 1200 }) altText width height }`;
const META_FRAG =
  `fragment Meta on Metafield { id namespace key value type }`;

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
    compareAtPriceRange { minVariantPrice { ...Money } maxVariantPrice { ...Money } }
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
    gemstone: metafield(namespace: "custom", key: "gemstone") { ...Meta }
    gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...Meta }
    gemstone_cut: metafield(namespace: "custom", key: "gemstone_cut") { ...Meta }
    gemstone_carat: metafield(namespace: "custom", key: "gemstone_carat") { ...Meta }
    gemstone_clarity: metafield(namespace: "custom", key: "gemstone_clarity") { ...Meta }
    gemstone_color: metafield(namespace: "custom", key: "gemstone_color") { ...Meta }
    craftsmanship_techniques: metafield(namespace: "custom", key: "craftsmanship_techniques") { ...Meta }
    delivery_info: metafield(namespace: "custom", key: "delivery_info") { ...Meta }
    returns_info: metafield(namespace: "custom", key: "returns_info") { ...Meta }
    reviews: metafield(namespace: "custom", key: "reviews") { ...Meta }
    rating: metafield(namespace: "reviews", key: "rating") { value }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
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
    cost {
      totalAmount { ...Money }
      subtotalAmount { ...Money }
      amountPerQuantity { ...Money }
      compareAtAmountPerQuantity { ...Money }
    }
    attributes { key value }
  }`;

const CART_DATA_FRAG = `
  fragment CartData on Cart {
    id checkoutUrl totalQuantity
    lines(first: 100) { edges { node { ...CartLine } } }
    cost {
      totalAmount { ...Money }
      subtotalAmount { ...Money }
      totalTaxAmount { ...Money }
      totalDutyAmount { ...Money }
    }
    discountCodes { code applicable }
    note
    attributes { key value }
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

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    ...CORS_BASE_HEADERS,
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }

  if (!headers.has("X-Gehnok-Worker")) {
    headers.set("X-Gehnok-Worker", "shopify-proxy");
  }

  if (!headers.has("X-Shopify-Upstream-Status")) {
    headers.set("X-Shopify-Upstream-Status", "0");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function jsonResponse(
  value: unknown,
  status = 200,
  upstreamStatus = "0",
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Gehnok-Worker": "shopify-proxy",
      "X-Shopify-Upstream-Status": upstreamStatus,
    },
  });
}

function getShopifyConfig(env: Env) {
  const rawDomain = env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const apiVersion = env.SHOPIFY_API_VERSION?.trim() || "2026-01";

  if (!rawDomain) {
    throw new ResponseError("SHOPIFY_STORE_DOMAIN is missing", 500);
  }

  if (!token) {
    throw new ResponseError(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing",
      500,
    );
  }

  const storeDomain = rawDomain.replace(/^https?:\/\//, "").split("/")[0];

  return {
    endpoint: `https://${storeDomain}/api/${apiVersion}/graphql.json`,
    token,
  };
}

class ResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: Record<string, unknown>,
    readonly upstreamStatus = "0",
  ) {
    super(message);
  }
}

function routeError(error: unknown, fallbackStatus = 502): Response {
  if (error instanceof ResponseError) {
    return jsonResponse(
      {
        success: false,
        error: error.message,
        ...error.details,
      },
      error.status,
      error.upstreamStatus,
    );
  }

  return jsonResponse(
    {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    },
    fallbackStatus,
  );
}

async function shopifyFetch<T extends ShopifyData>(
  env: Env,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { endpoint, token } = getShopifyConfig(env);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = (await response.json()) as ShopifyGraphqlResponse<T>;

  if (!response.ok) {
    throw new ResponseError(
      `Shopify API HTTP error: ${response.status}`,
      502,
      undefined,
      String(response.status),
    );
  }

  if (result.errors?.length) {
    const message = result.errors
      .map((entry) => entry.message)
      .filter(Boolean)
      .join("; ");

    throw new ResponseError(
      `Shopify GraphQL errors: ${message || "Unknown error"}`,
      502,
      undefined,
      String(response.status),
    );
  }

  return (result.data ?? {}) as T;
}

async function proxyGraphql(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const requestBody = await request.text();

  if (!requestBody.trim()) {
    return jsonResponse(
      { success: false, error: "Request body is empty" },
      400,
    );
  }

  const { endpoint, token } = getShopifyConfig(env);

  const shopifyResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: requestBody,
  });

  return new Response(shopifyResponse.body, {
    status: shopifyResponse.status,
    headers: {
      "Content-Type":
        shopifyResponse.headers.get("Content-Type") ||
        "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Gehnok-Worker": "shopify-proxy",
      "X-Shopify-Upstream-Status": String(shopifyResponse.status),
    },
  });
}

function methodNotAllowed(): Response {
  return jsonResponse(
    {
      success: false,
      error: "Method not allowed",
    },
    405,
  );
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.body) {
    return {};
  }

  try {
    const value = await request.json();
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    throw new ResponseError("Invalid JSON request body", 400);
  }
}

function parseFirst(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || String(fallback), 10);
  const first = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(first, 1), max);
}

function pathSegments(pathname: string): string[] {
  const suffix = pathname.slice(API_PREFIX.length).replace(/^\/+|\/+$/g, "");

  if (!suffix) {
    return [];
  }

  return suffix.split("/").map((segment) => decodeURIComponent(segment));
}

function authorizationToken(request: Request): string {
  return request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
}

export async function handleShopifyApi(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(
      new Response(null, {
        status: 204,
        headers: {
          "X-Gehnok-Worker": "shopify-proxy",
          "X-Shopify-Upstream-Status": "0",
        },
      }),
      request,
    );
  }

  const url = new URL(request.url);
  const segments = pathSegments(url.pathname);

  try {
    if (segments.length === 0) {
      return withCors(await proxyGraphql(request, env), request);
    }

    const response = await handleRestRoute(request, env, url, segments);

    if (response) {
      return withCors(response, request);
    }

    return withCors(
      jsonResponse(
        {
          success: false,
          error: "Shopify API route not found",
        },
        404,
      ),
      request,
    );
  } catch (error) {
    return withCors(routeError(error), request);
  }
}

async function handleRestRoute(
  request: Request,
  env: Env,
  url: URL,
  segments: string[],
): Promise<Response | null> {
  const [resource, second, third, fourth] = segments;

  if (request.method === "GET" && resource === "products" && !second) {
    return getProducts(env, url);
  }

  if (
    request.method === "GET" &&
    resource === "products" &&
    second &&
    third === "variant" &&
    !fourth
  ) {
    return getProductVariant(env, url, second);
  }

  if (request.method === "GET" && resource === "products" && second && !third) {
    return getProduct(env, second);
  }

  if (request.method === "GET" && resource === "collections" && !second) {
    return getCollections(env, url);
  }

  if (
    request.method === "GET" &&
    resource === "collections" &&
    second &&
    third === "products" &&
    !fourth
  ) {
    return getCollectionProducts(env, url, second);
  }

  if (request.method === "GET" && resource === "articles" && !second) {
    return getArticles(env, url);
  }

  if (request.method === "GET" && resource === "search" && !second) {
    return searchProducts(env, url);
  }

  if (request.method === "GET" && resource === "policies" && !second) {
    return getPolicies(env);
  }

  if (
    request.method === "GET" &&
    resource === "metaobjects" &&
    second &&
    third &&
    !fourth
  ) {
    return getMetaobject(env, second, third);
  }

  if (resource === "cart") {
    return handleCartRoute(request, env, segments);
  }

  if (resource === "customer") {
    return handleCustomerRoute(request, env, segments);
  }

  if (request.method === "POST" && resource === "cache" && second === "clear") {
    return jsonResponse({
      success: true,
      message: "Shopify cache cleared",
    });
  }

  if (allowedMethodsFor(segments)) {
    return methodNotAllowed();
  }

  return null;
}

function allowedMethodsFor(segments: string[]): string[] | null {
  const [resource, second, third, fourth] = segments;

  if (resource === "products" && !second) return ["GET"];
  if (resource === "products" && second && third === "variant" && !fourth) {
    return ["GET"];
  }
  if (resource === "products" && second && !third) return ["GET"];
  if (resource === "collections" && !second) return ["GET"];
  if (resource === "collections" && second && third === "products" && !fourth) {
    return ["GET"];
  }
  if (resource === "articles" && !second) return ["GET"];
  if (resource === "search" && !second) return ["GET"];
  if (resource === "policies" && !second) return ["GET"];
  if (resource === "metaobjects" && second && third && !fourth) return ["GET"];
  if (resource === "cart" && !second) return ["POST"];
  if (resource === "cart" && second && !third) return ["GET"];
  if (resource === "cart" && second && third === "lines" && !fourth) {
    return ["POST"];
  }
  if (resource === "cart" && second && third === "lines" && fourth) {
    return ["PATCH", "DELETE"];
  }
  if (resource === "cart" && second && third === "discount" && !fourth) {
    return ["POST"];
  }
  if (resource === "customer" && !second) return ["GET"];
  if (
    resource === "customer" &&
    ["login", "register", "recover"].includes(second || "") &&
    !third
  ) {
    return ["POST"];
  }
  if (resource === "customer" && second === "logout" && !third) return ["DELETE"];
  if (resource === "cache" && second === "clear" && !third) return ["POST"];

  return null;
}

function readableMutationMessage(
  fallback: string,
  userErrors?: ShopifyUserError[],
): string {
  return userErrors?.find((error) => error.message)?.message || fallback;
}

function mutationFailure(
  fallback: string,
  userErrors?: ShopifyUserError[],
  warnings?: ShopifyWarning[],
): Response {
  return jsonResponse(
    {
      success: false,
      error: readableMutationMessage(fallback, userErrors),
      userErrors: userErrors ?? [],
      warnings: warnings ?? [],
    },
    400,
    "200",
  );
}

function cartSuccess(cart: unknown, warnings?: ShopifyWarning[]): Response {
  const value: { cart: unknown; warnings?: ShopifyWarning[] } = { cart };

  if (warnings?.length) {
    value.warnings = warnings;
  }

  return jsonResponse(value, 200, "200");
}

async function getProducts(env: Env, url: URL): Promise<Response> {
  const first = parseFirst(url.searchParams.get("first"), 50, 250);
  const sortKey = url.searchParams.get("sortKey") || "CREATED_AT";
  const reverse = url.searchParams.get("reverse") === "true";
  const after = url.searchParams.get("after");

  const data = await shopifyFetch<{
    products: {
      edges: Array<{ cursor: string; node: unknown }>;
      pageInfo: unknown;
    };
  }>(
    env,
    `${PRODUCT_QUERY_FRAGMENTS}
    query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        pageInfo { hasNextPage endCursor }
        edges { cursor node { ...Prod } }
      }
    }`,
    { first, after, sortKey, reverse },
  );

  return jsonResponse({
    products: data.products.edges.map((edge) => edge.node),
    pageInfo: data.products.pageInfo,
  }, 200, "200");
}

async function getProduct(env: Env, handle: string): Promise<Response> {
  const data = await shopifyFetch<{ product: unknown }>(
    env,
    `${PRODUCT_QUERY_FRAGMENTS}
    query Product($handle: String!) {
      product(handle: $handle) { ...Prod }
    }`,
    { handle },
  );

  if (!data.product) {
    return jsonResponse(
      { success: false, error: "Product not found" },
      404,
      "200",
    );
  }

  return jsonResponse({ product: data.product }, 200, "200");
}

async function getProductVariant(
  env: Env,
  url: URL,
  productIdentifier: string,
): Promise<Response> {
  const metal = url.searchParams.get("metal") || "";
  const size = url.searchParams.get("size") || "";

  const product = productIdentifier.startsWith("gid://shopify/Product/")
    ? await getProductVariantsById(env, productIdentifier)
    : await getProductVariantsByHandle(env, productIdentifier);

  const variants = product?.variants?.edges?.map((edge) => edge.node) ?? [];
  const match = findMatchingVariant(variants, metal, size);

  if (!match?.id) {
    return jsonResponse(
      {
        success: false,
        error: "Variant not found for selected options",
        variantId: null,
      },
      404,
      "200",
    );
  }

  return jsonResponse({ variantId: match.id }, 200, "200");
}

type VariantForMatching = {
  id?: string;
  selectedOptions?: Array<{ name?: string; value?: string }>;
};

type ProductVariantsResult = {
  variants?: {
    edges?: Array<{
      node: VariantForMatching;
    }>;
  };
};

async function getProductVariantsByHandle(
  env: Env,
  handle: string,
): Promise<ProductVariantsResult | undefined> {
  const data = await shopifyFetch<{ product?: ProductVariantsResult }>(
    env,
    `${IMAGE_FRAG}
    ${MONEY_FRAG}
    ${VARIANT_FRAG}
    query ProductVariantsByHandle($handle: String!) {
      product(handle: $handle) {
        variants(first: 100) { edges { node { ...Variant } } }
      }
    }`,
    { handle },
  );

  return data.product;
}

async function getProductVariantsById(
  env: Env,
  id: string,
): Promise<ProductVariantsResult | undefined> {
  const data = await shopifyFetch<{ node?: ProductVariantsResult }>(
    env,
    `${IMAGE_FRAG}
    ${MONEY_FRAG}
    ${VARIANT_FRAG}
    query ProductVariantsById($id: ID!) {
      node(id: $id) {
        ... on Product {
          variants(first: 100) { edges { node { ...Variant } } }
        }
      }
    }`,
    { id },
  );

  return data.node;
}

function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function optionValueMatches(actual: string, expected: string): boolean {
  const normalizedActual = normalizeOptionValue(actual);
  const normalizedExpected = normalizeOptionValue(expected);

  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}

function findMatchingVariant(
  variants: VariantForMatching[],
  metal: string,
  size: string,
): VariantForMatching | undefined {
  if (variants.length === 1) {
    return variants[0];
  }

  const hasMetal = Boolean(metal.trim());
  const hasSize = Boolean(size.trim());

  if (!hasMetal && !hasSize) {
    return variants[0];
  }

  return variants.find((variant) => {
    const options = variant.selectedOptions ?? [];
    const metalMatches =
      !hasMetal ||
      options.some((option) => {
        const name = option.name?.toLowerCase() || "";
        return (
          (name.includes("metal") || name.includes("material")) &&
          option.value !== undefined &&
          optionValueMatches(option.value, metal)
        );
      });

    const sizeMatches =
      !hasSize ||
      options.some((option) => {
        const name = option.name?.toLowerCase() || "";
        return (
          name.includes("size") &&
          option.value !== undefined &&
          optionValueMatches(option.value, size)
        );
      });

    return metalMatches && sizeMatches;
  });
}

async function getCollections(env: Env, url: URL): Promise<Response> {
  const first = parseFirst(url.searchParams.get("first"), 20, 250);

  const data = await shopifyFetch<{
    collections: { edges: Array<{ node: unknown }> };
  }>(
    env,
    `${IMAGE_FRAG}
    query Collections($first: Int!) {
      collections(first: $first) {
        edges { node { id handle title description image { ...Img } } }
      }
    }`,
    { first },
  );

  return jsonResponse({
    collections: data.collections.edges.map((edge) => edge.node),
  }, 200, "200");
}

async function getCollectionProducts(
  env: Env,
  url: URL,
  handle: string,
): Promise<Response> {
  const first = parseFirst(url.searchParams.get("first"), 50, 250);
  const after = url.searchParams.get("after");

  const data = await shopifyFetch<{
    collection?: {
      products: {
        edges: Array<{ cursor: string; node: unknown }>;
        pageInfo: unknown;
      };
    };
  }>(
    env,
    `${PRODUCT_QUERY_FRAGMENTS}
    query Col($handle: String!, $first: Int!, $after: String) {
      collection(handle: $handle) {
        id handle title description
        image { ...Img }
        products(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { cursor node { ...Prod } }
        }
      }
    }`,
    { handle, first, after },
  );

  if (!data.collection) {
    return jsonResponse(
      { success: false, error: "Collection not found" },
      404,
      "200",
    );
  }

  return jsonResponse({
    collection: data.collection,
    products: data.collection.products.edges.map((edge) => edge.node),
    pageInfo: data.collection.products.pageInfo,
  }, 200, "200");
}

async function getArticles(env: Env, url: URL): Promise<Response> {
  const first = parseFirst(url.searchParams.get("first"), 3, 50);

  const data = await shopifyFetch<{
    articles?: { edges?: Array<{ node: unknown }> };
  }>(
    env,
    `query Articles($first: Int!) {
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
    { first },
  );

  return jsonResponse({
    articles: data.articles?.edges?.map((edge) => edge.node) ?? [],
  }, 200, "200");
}

async function searchProducts(env: Env, url: URL): Promise<Response> {
  const query = (url.searchParams.get("q") || "").trim();

  if (!query) {
    return jsonResponse(
      {
        success: false,
        error: "Search query is required",
        products: [],
      },
      400,
    );
  }

  const first = parseFirst(url.searchParams.get("first"), 10, 50);

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: unknown }> };
  }>(
    env,
    `${IMAGE_FRAG}
    ${MONEY_FRAG}
    ${META_FRAG}
    ${VARIANT_FRAG}
    query Search($query: String!, $first: Int!) {
      products(query: $query, first: $first) {
        edges { node {
          id handle title description descriptionHtml productType vendor tags availableForSale
          priceRange { minVariantPrice { ...Money } maxVariantPrice { ...Money } }
          images(first: 3) { edges { node { ...Img } } }
          variants(first: 5) { edges { node { ...Variant } } }
          seo { title description }
          options { name optionValues { name swatch { color } } }
          metal: metafield(namespace: "custom", key: "metal") { ...Meta }
          purity: metafield(namespace: "custom", key: "purity") { ...Meta }
          gemstone: metafield(namespace: "custom", key: "gemstone") { ...Meta }
          gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...Meta }
          reviews: metafield(namespace: "custom", key: "reviews") { ...Meta }
          rating: metafield(namespace: "reviews", key: "rating") { value }
          ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
        }}
      }
    }`,
    { query, first },
  );

  return jsonResponse({
    products: data.products.edges.map((edge) => edge.node),
  }, 200, "200");
}

async function getPolicies(env: Env): Promise<Response> {
  const data = await shopifyFetch<{ shop: unknown }>(
    env,
    `query ShopPolicies {
      shop {
        privacyPolicy { title body }
        shippingPolicy { title body }
        termsOfService { title body }
        refundPolicy { title body }
      }
    }`,
  );

  return jsonResponse(data, 200, "200");
}

async function getMetaobject(
  env: Env,
  type: string,
  handle: string,
): Promise<Response> {
  const data = await shopifyFetch<{ metaobject: unknown }>(
    env,
    `query GetMetaobject($handle: MetaobjectHandleInput!) {
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
    { handle: { type, handle } },
  );

  return jsonResponse(data, 200, "200");
}

async function handleCartRoute(
  request: Request,
  env: Env,
  segments: string[],
): Promise<Response | null> {
  const [, cartId, third, lineId] = segments;

  if (request.method === "POST" && !cartId) {
    const body = await readJsonBody(request);
    const lines = Array.isArray(body.lines) ? body.lines : [];

    const data = await shopifyFetch<{
      cartCreate: {
        cart: unknown;
        userErrors?: ShopifyUserError[];
        warnings?: ShopifyWarning[];
      };
    }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      mutation CreateCart($input: CartInput) {
        cartCreate(input: $input) {
          cart { ...CartData }
          userErrors { field message }
          warnings { code target message }
        }
      }`,
      {
        input: {
          lines,
          note: body.note,
          attributes: body.attributes,
        },
      },
    );

    if (data.cartCreate.userErrors?.length) {
      return mutationFailure(
        "Cart creation failed",
        data.cartCreate.userErrors,
        data.cartCreate.warnings,
      );
    }

    return cartSuccess(data.cartCreate.cart, data.cartCreate.warnings);
  }

  if (request.method === "GET" && cartId && !third) {
    const data = await shopifyFetch<{ cart: unknown }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      query Cart($cartId: ID!) {
        cart(id: $cartId) { ...CartData }
      }`,
      { cartId },
    );

    if (!data.cart) {
      return jsonResponse(
        { success: false, error: "Cart not found or expired" },
        404,
        "200",
      );
    }

    return jsonResponse({ cart: data.cart }, 200, "200");
  }

  if (request.method === "POST" && cartId && third === "lines" && !lineId) {
    const body = await readJsonBody(request);

    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return jsonResponse({ success: false, error: "lines required" }, 400);
    }

    const data = await shopifyFetch<{
      cartLinesAdd: {
        cart: unknown;
        userErrors?: ShopifyUserError[];
        warnings?: ShopifyWarning[];
      };
    }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartData }
          userErrors { field message }
          warnings { code target message }
        }
      }`,
      { cartId, lines: body.lines },
    );

    if (data.cartLinesAdd.userErrors?.length) {
      return mutationFailure(
        "Add to cart failed",
        data.cartLinesAdd.userErrors,
        data.cartLinesAdd.warnings,
      );
    }

    return cartSuccess(data.cartLinesAdd.cart, data.cartLinesAdd.warnings);
  }

  if (request.method === "PATCH" && cartId && third === "lines" && lineId) {
    const body = await readJsonBody(request);

    if (typeof body.quantity !== "number") {
      return jsonResponse({ success: false, error: "quantity required" }, 400);
    }

    const data = await shopifyFetch<{
      cartLinesUpdate: {
        cart: unknown;
        userErrors?: ShopifyUserError[];
        warnings?: ShopifyWarning[];
      };
    }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartData }
          userErrors { field message }
          warnings { code target message }
        }
      }`,
      { cartId, lines: [{ id: lineId, quantity: body.quantity }] },
    );

    if (data.cartLinesUpdate.userErrors?.length) {
      return mutationFailure(
        "Update cart line failed",
        data.cartLinesUpdate.userErrors,
        data.cartLinesUpdate.warnings,
      );
    }

    return cartSuccess(data.cartLinesUpdate.cart, data.cartLinesUpdate.warnings);
  }

  if (request.method === "DELETE" && cartId && third === "lines" && lineId) {
    const data = await shopifyFetch<{
      cartLinesRemove: {
        cart: unknown;
        userErrors?: ShopifyUserError[];
        warnings?: ShopifyWarning[];
      };
    }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartData }
          userErrors { field message }
          warnings { code target message }
        }
      }`,
      { cartId, lineIds: [lineId] },
    );

    if (data.cartLinesRemove.userErrors?.length) {
      return mutationFailure(
        "Remove cart line failed",
        data.cartLinesRemove.userErrors,
        data.cartLinesRemove.warnings,
      );
    }

    return cartSuccess(data.cartLinesRemove.cart, data.cartLinesRemove.warnings);
  }

  if (request.method === "POST" && cartId && third === "discount" && !lineId) {
    const body = await readJsonBody(request);

    if (!Array.isArray(body.discountCodes)) {
      return jsonResponse(
        { success: false, error: "discountCodes array required" },
        400,
      );
    }

    const data = await shopifyFetch<{
      cartDiscountCodesUpdate: {
        cart: unknown;
        userErrors?: ShopifyUserError[];
        warnings?: ShopifyWarning[];
      };
    }>(
      env,
      `${CART_QUERY_FRAGMENTS}
      mutation Discount($cartId: ID!, $discountCodes: [String!]!) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
          cart { ...CartData }
          userErrors { field message }
          warnings { code target message }
        }
      }`,
      { cartId, discountCodes: body.discountCodes },
    );

    if (data.cartDiscountCodesUpdate.userErrors?.length) {
      return mutationFailure(
        "Discount update failed",
        data.cartDiscountCodesUpdate.userErrors,
        data.cartDiscountCodesUpdate.warnings,
      );
    }

    return cartSuccess(
      data.cartDiscountCodesUpdate.cart,
      data.cartDiscountCodesUpdate.warnings,
    );
  }

  return null;
}

async function handleCustomerRoute(
  request: Request,
  env: Env,
  segments: string[],
): Promise<Response | null> {
  const [, action] = segments;

  if (request.method === "POST" && action === "register") {
    const body = await readJsonBody(request);
    const { firstName, lastName, email, password } = body;

    if (!email || !password) {
      return jsonResponse(
        { success: false, error: "Email and password required" },
        400,
      );
    }

    const data = await shopifyFetch<{
      customerCreate: {
        customer: unknown;
        customerUserErrors?: ShopifyUserError[];
      };
    }>(
      env,
      `mutation Register($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer { id firstName lastName email }
          customerUserErrors { field code message }
        }
      }`,
      {
        input: {
          firstName,
          lastName,
          email,
          password,
          acceptsMarketing: false,
        },
      },
    );

    if (data.customerCreate.customerUserErrors?.length) {
      return mutationFailure(
        "Registration failed",
        data.customerCreate.customerUserErrors,
      );
    }

    return jsonResponse({ customer: data.customerCreate.customer }, 200, "200");
  }

  if (request.method === "POST" && action === "login") {
    const body = await readJsonBody(request);
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse(
        { success: false, error: "Email and password required" },
        400,
      );
    }

    const data = await shopifyFetch<{
      customerAccessTokenCreate: {
        customerAccessToken?: { accessToken: string; expiresAt: string } | null;
        customerUserErrors?: ShopifyUserError[];
      };
    }>(
      env,
      `mutation Login($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { field code message }
        }
      }`,
      { input: { email, password } },
    );

    const tokenData = data.customerAccessTokenCreate.customerAccessToken;

    if (!tokenData) {
      return jsonResponse(
        {
          success: false,
          error:
            data.customerAccessTokenCreate.customerUserErrors?.[0]?.message ||
            "Invalid credentials",
          userErrors:
            data.customerAccessTokenCreate.customerUserErrors ?? [],
        },
        401,
        "200",
      );
    }

    return jsonResponse({
      accessToken: tokenData.accessToken,
      expiresAt: tokenData.expiresAt,
    }, 200, "200");
  }

  if (request.method === "DELETE" && action === "logout") {
    const token = authorizationToken(request);

    if (!token) {
      return jsonResponse({ success: false, error: "Token required" }, 400);
    }

    const data = await shopifyFetch<{
      customerAccessTokenDelete: {
        deletedAccessToken?: string | null;
        userErrors?: ShopifyUserError[];
      };
    }>(
      env,
      `mutation Logout($customerAccessToken: String!) {
        customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
          deletedAccessToken
          userErrors { field message }
        }
      }`,
      { customerAccessToken: token },
    );

    if (data.customerAccessTokenDelete.userErrors?.length) {
      return mutationFailure(
        "Logout failed",
        data.customerAccessTokenDelete.userErrors,
      );
    }

    return jsonResponse({ success: true }, 200, "200");
  }

  if (request.method === "GET" && !action) {
    const token = authorizationToken(request);

    if (!token) {
      return jsonResponse(
        { success: false, error: "Authorization token required" },
        401,
      );
    }

    const data = await shopifyFetch<{ customer: unknown }>(
      env,
      `
      fragment Addr on MailingAddress {
        id firstName lastName address1 city country zip phone
      }
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
          orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
            edges { node { ...Ord } }
          }
        }
      }`,
      { token },
    );

    if (!data.customer) {
      return jsonResponse(
        { success: false, error: "Customer not found" },
        404,
        "200",
      );
    }

    return jsonResponse({ customer: data.customer }, 200, "200");
  }

  if (request.method === "POST" && action === "recover") {
    const body = await readJsonBody(request);

    if (!body.email) {
      return jsonResponse({ success: false, error: "Email required" }, 400);
    }

    const data = await shopifyFetch<{
      customerRecover: { customerUserErrors?: ShopifyUserError[] };
    }>(
      env,
      `mutation Recover($email: String!) {
        customerRecover(email: $email) {
          customerUserErrors { field code message }
        }
      }`,
      { email: body.email },
    );

    if (data.customerRecover.customerUserErrors?.length) {
      return mutationFailure(
        "Password recovery failed",
        data.customerRecover.customerUserErrors,
      );
    }

    return jsonResponse({ success: true }, 200, "200");
  }

  return null;
}
