/**
 * GEHNOK Shopify Headless Integration
 * GraphQL Queries — all Storefront API read operations.
 */

import {
  PRODUCT_QUERY_FRAGMENTS,
  CART_QUERY_FRAGMENTS,
  CUSTOMER_ADDRESS_FRAGMENT,
  ORDER_FRAGMENT,
  MONEY_FRAGMENT,
  IMAGE_FRAGMENT,
} from './fragments';

// ─── Products ────────────────────────────────────────────────────────────────

/** Fetch all products (with pagination support) */
export const GET_PRODUCTS = /* GraphQL */ `
  ${PRODUCT_QUERY_FRAGMENTS}
  query GetProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node { ...ProductFragment }
      }
    }
  }
`;

/** Fetch a single product by handle */
export const GET_PRODUCT_BY_HANDLE = /* GraphQL */ `
  ${PRODUCT_QUERY_FRAGMENTS}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFragment
    }
  }
`;

/** Fetch products belonging to a specific collection by handle */
export const GET_COLLECTION_BY_HANDLE = /* GraphQL */ `
  ${PRODUCT_QUERY_FRAGMENTS}
  query GetCollectionByHandle($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image { ...ImageFragment }
      seo { title description }
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          cursor
          node { ...ProductFragment }
        }
      }
    }
  }
`;

/** Fetch all collections */
export const GET_COLLECTIONS = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { ...ImageFragment }
        }
      }
    }
  }
`;

/** Fetch product recommendations for related products section */
export const GET_PRODUCT_RECOMMENDATIONS = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  query GetProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      handle
      title
      productType
      priceRange {
        minVariantPrice { ...MoneyFragment }
      }
      images(first: 1) {
        edges {
          node { ...ImageFragment }
        }
      }
    }
  }
`;

/** Search products by query string */
export const SEARCH_PRODUCTS = /* GraphQL */ `
  ${PRODUCT_QUERY_FRAGMENTS}
  query SearchProducts($query: String!, $first: Int!) {
    products(query: $query, first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          vendor
          tags
          availableForSale
          priceRange {
            minVariantPrice { ...MoneyFragment }
          }
          images(first: 3) {
            edges { node { ...ImageFragment } }
          }
          variants(first: 5) {
            edges { node { ...ProductVariantFragment } }
          }
          seo { title description }
          metal: metafield(namespace: "custom", key: "metal") { ...MetafieldFragment }
          purity: metafield(namespace: "custom", key: "purity") { ...MetafieldFragment }
          gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...MetafieldFragment }
          reviews: metafield(namespace: "custom", key: "reviews") { ...MetafieldFragment }
          rating: metafield(namespace: "reviews", key: "rating") { value }
          ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
        }
      }
    }
  }
`;

/** Predictive search (lightweight, for autocomplete) */
export const PREDICTIVE_SEARCH = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  query PredictiveSearch($query: String!, $limit: Int!) {
    predictiveSearch(query: $query, limit: $limit) {
      products {
        id
        handle
        title
        productType
        priceRange {
          minVariantPrice { ...MoneyFragment }
        }
        images(first: 1) {
          edges { node { ...ImageFragment } }
        }
      }
      collections {
        id
        handle
        title
      }
    }
  }
`;

// ─── Cart ────────────────────────────────────────────────────────────────────

/** Fetch an existing cart by ID */
export const GET_CART = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
`;

// ─── Customer ────────────────────────────────────────────────────────────────

/** Fetch authenticated customer details and order history */
export const GET_CUSTOMER = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CUSTOMER_ADDRESS_FRAGMENT}
  ${ORDER_FRAGMENT}
  query GetCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      displayName
      email
      phone
      tags
      defaultAddress { ...CustomerAddressFragment }
      addresses(first: 10) {
        edges { node { ...CustomerAddressFragment } }
      }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges { node { ...OrderFragment } }
      }
    }
  }
`;
