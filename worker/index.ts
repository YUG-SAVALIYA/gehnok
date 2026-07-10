type Env = {
  SHOPIFY_STORE_DOMAIN?: string;
  SHOPIFY_API_VERSION?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
};

function jsonResponse(
  value: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Gehnok-Worker": "shopify-proxy",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Supports both https://gehnok.gehnokjewels.workers.dev/api/shopify and https://gehnok.gehnokjewels.workers.dev/api/shopify/
    const pathname =
      url.pathname.replace(/\/+$/, "") || "/";

    if (pathname !== "https://gehnok.gehnokjewels.workers.dev/api/shopify") {
      return jsonResponse(
        {
          error: "Route not found",
          pathname,
        },
        404,
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Accept",
          "X-Gehnok-Worker": "shopify-proxy",
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
      env.SHOPIFY_STORE_DOMAIN?.trim();

    const token =
      env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();

    const apiVersion =
      env.SHOPIFY_API_VERSION?.trim() ||
      "2026-01";

    if (!rawDomain) {
      return jsonResponse(
        {
          error: "SHOPIFY_STORE_DOMAIN is missing",
        },
        500,
      );
    }

    if (!token) {
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
      .split("/")[0];

    const requestBody = await request.text();

    if (!requestBody.trim()) {
      return jsonResponse(
        { error: "Request body is empty" },
        400,
      );
    }

    const shopifyEndpoint =
      `https://${storeDomain}` +
      `/api/${apiVersion}/graphql.json`;

    try {
      const shopifyResponse = await fetch(
        shopifyEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",

            // Public Storefront token header
            "X-Shopify-Storefront-Access-Token":
              token,
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
            ) ||
            "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "X-Gehnok-Worker": "shopify-proxy",
          "X-Shopify-Upstream-Status":
            String(shopifyResponse.status),
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
};