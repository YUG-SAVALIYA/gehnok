const DEFAULT_SHOPIFY_API_BASE =
  "https://gehnok.gehnokjewels.workers.dev/api/shopify";

const envApiBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_API_BASE) ||
  (typeof process !== "undefined" && process.env?.VITE_SHOPIFY_API_BASE);

export const SHOPIFY_API_BASE = (
  envApiBase || DEFAULT_SHOPIFY_API_BASE
).replace(/\/+$/, "");

export function createShopifyApiUrl(path = ""): string {
  const base = path
    ? `${SHOPIFY_API_BASE}/${path.replace(/^\/+/, "")}`
    : SHOPIFY_API_BASE;
    
  // Append a cache buster timestamp to break through stale Cloudflare Edge caches
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}cb=${Date.now()}`;
}
