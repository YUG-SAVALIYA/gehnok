export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/shopify") {
      return Response.json(
        { error: "API route not found" },
        { status: 404 },
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
      return Response.json(
        { error: "Method not allowed" },
        {
          status: 405,
          headers: {
            Allow: "POST, OPTIONS",
          },
        },
      );
    }

    try {
      if (!env.SHOPIFY_STORE_DOMAIN) {
        throw new Error("SHOPIFY_STORE_DOMAIN is missing");
      }

      if (!env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
        throw new Error(
          "SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing",
        );
      }

      const storeDomain = env.SHOPIFY_STORE_DOMAIN
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      const apiVersion =
        env.SHOPIFY_API_VERSION || "2026-07";

      const requestBody = await request.text();

      if (!requestBody) {
        return Response.json(
          { error: "GraphQL request body is missing" },
          { status: 400 },
        );
      }

      const shopifyResponse = await fetch(
        `https://${storeDomain}/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token":
              env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
          },
          body: requestBody,
        },
      );

      const responseText = await shopifyResponse.text();

      return new Response(responseText, {
        status: shopifyResponse.status,
        headers: {
          "Content-Type":
            shopifyResponse.headers.get("Content-Type") ||
            "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error("Shopify proxy error:", error);

      return Response.json(
        {
          error: "Shopify request failed",
          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
};