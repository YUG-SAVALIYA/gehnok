interface Env {
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
  SHOPIFY_API_VERSION?: string;

  // Supports your existing Vite-style variable names too.
  VITE_SHOPIFY_STORE_DOMAIN?: string;
  VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
  VITE_SHOPIFY_API_VERSION?: string;
}

function jsonResponse(
  value: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/api/shopify") {
      return jsonResponse(
        { error: "Route not found" },
        404,
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed" },
        405,
      );
    }

    const rawDomain =
      env.SHOPIFY_STORE_DOMAIN ||
      env.VITE_SHOPIFY_STORE_DOMAIN;

    const storefrontToken =
      env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
      env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    const apiVersion =
      env.SHOPIFY_API_VERSION ||
      env.VITE_SHOPIFY_API_VERSION ||
      "2026-07";

    if (!rawDomain) {
      return jsonResponse(
        {
          error: "SHOPIFY_STORE_DOMAIN is missing",
        },
        500,
      );
    }

    if (!storefrontToken) {
      return jsonResponse(
        {
          error:
            "SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing",
        },
        500,
      );
    }

    const storeDomain = rawDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/\/$/, "");

    try {
      const requestBody = await request.text();

      if (!requestBody) {
        return jsonResponse(
          { error: "Request body is empty" },
          400,
        );
      }

      const shopifyResponse = await fetch(
        `https://${storeDomain}/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token":
              storefrontToken,
          },
          body: requestBody,
        },
      );

      const responseBody =
        await shopifyResponse.text();

      return new Response(responseBody, {
        status: shopifyResponse.status,
        headers: {
          "Content-Type":
            shopifyResponse.headers.get(
              "Content-Type",
            ) || "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error("Shopify proxy failed:", error);

      return jsonResponse(
        {
          error: "Shopify proxy failed",
          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        500,
      );
    }
  },
} satisfies ExportedHandler<Env>;