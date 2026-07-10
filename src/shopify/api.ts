const DEFAULT_SHOPIFY_API_BASE =
  "https://gehnok.gehnokjewels.workers.dev/api/shopify";

export const SHOPIFY_API_BASE = (
  import.meta.env.VITE_SHOPIFY_API_BASE ||
  DEFAULT_SHOPIFY_API_BASE
).replace(/\/+$/, "");

export function createShopifyApiUrl(path = ""): string {
  return path
    ? `${SHOPIFY_API_BASE}/${path.replace(/^\/+/, "")}`
    : SHOPIFY_API_BASE;
}
