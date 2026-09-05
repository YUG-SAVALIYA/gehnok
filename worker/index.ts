import { handleShopifyApi, handleMetalRates, jsonResponse, type Env } from "./shopify";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (
      url.pathname === "/api/metal-rates" ||
      url.pathname.startsWith("/api/metal-rates/") ||
      url.pathname === "/api/shopify/metal-rates" ||
      url.pathname.startsWith("/api/shopify/metal-rates/")
    ) {
      return handleMetalRates(request, env);
    }

    if (
      url.pathname === "/api/shopify" ||
      url.pathname.startsWith("/api/shopify/")
    ) {
      return handleShopifyApi(request, env);
    }

    return jsonResponse(
      {
        success: false,
        error: "Route not found",
        pathname: url.pathname,
      },
      404,
    );
  },
};
