const DEFAULT_SHOPIFY_API_BASE =
  "https://gehnok.gehnokjewels.workers.dev/api/shopify";

export const SHOPIFY_API_BASE = (
  import.meta.env.VITE_SHOPIFY_API_BASE ||
  DEFAULT_SHOPIFY_API_BASE
).replace(/\/+$/, "");

export function createShopifyApiUrl(path = ""): string {
  const base = path
    ? `${SHOPIFY_API_BASE}/${path.replace(/^\/+/, "")}`
    : SHOPIFY_API_BASE;
    
  // Append a cache buster timestamp to break through stale Cloudflare Edge caches
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}cb=${Date.now()}`;
}
