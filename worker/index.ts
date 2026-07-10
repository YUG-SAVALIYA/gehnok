import { handleShopifyApi, jsonResponse, type Env } from "./shopify";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
