/**
 * GEHNOK Shopify Headless Integration
 * GraphQL Mutations — all Storefront API write operations.
 */

import { CART_QUERY_FRAGMENTS } from './fragments';

// ─── Cart Mutations ───────────────────────────────────────────────────────────

/** Create a new Shopify cart */
export const CREATE_CART = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation CreateCart($input: CartInput) {
    cartCreate(input: $input) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Add one or more line items to a cart */
export const ADD_CART_LINES = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Update quantity of existing cart lines */
export const UPDATE_CART_LINES = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Remove one or more lines from a cart */
export const REMOVE_CART_LINES = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Apply or remove discount codes on a cart */
export const UPDATE_CART_DISCOUNT_CODES = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation UpdateCartDiscountCodes($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Update cart note */
export const UPDATE_CART_NOTE = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation UpdateCartNote($cartId: ID!, $note: String!) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

/** Update buyer identity (for customer-associated carts) */
export const UPDATE_CART_BUYER_IDENTITY = /* GraphQL */ `
  ${CART_QUERY_FRAGMENTS}
  mutation UpdateCartBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

// ─── Customer Mutations ───────────────────────────────────────────────────────

/** Register a new customer account */
export const CUSTOMER_CREATE = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
      }
      customerUserErrors {
        field
        code
        message
      }
    }
  }
`;

/** Login — exchange credentials for an access token */
export const CUSTOMER_ACCESS_TOKEN_CREATE = /* GraphQL */ `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        field
        code
        message
      }
    }
  }
`;

/** Logout — invalidate an existing access token */
export const CUSTOMER_ACCESS_TOKEN_DELETE = /* GraphQL */ `
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      deletedCustomerAccessTokenId
      userErrors { field message }
    }
  }
`;

/** Renew an expiring access token */
export const CUSTOMER_ACCESS_TOKEN_RENEW = /* GraphQL */ `
  mutation CustomerAccessTokenRenew($customerAccessToken: String!) {
    customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      userErrors { field message }
    }
  }
`;

/** Trigger a password reset email */
export const CUSTOMER_RECOVER = /* GraphQL */ `
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        field
        code
        message
      }
    }
  }
`;

/** Update customer profile information */
export const CUSTOMER_UPDATE = /* GraphQL */ `
  mutation CustomerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        field
        code
        message
      }
    }
  }
`;

/** Create a customer address */
export const CUSTOMER_ADDRESS_CREATE = /* GraphQL */ `
  mutation CustomerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress {
        id
        address1
        city
        country
        zip
      }
      customerUserErrors { field code message }
    }
  }
`;
