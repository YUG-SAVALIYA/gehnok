// src/shopify/shopifyFetch.ts

import { createShopifyApiUrl } from "./api";

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(createShopifyApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        `Shopify proxy failed: ${response.status}`,
    );
  }

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "Shopify GraphQL error");
  }

  return result.data as T;
}
