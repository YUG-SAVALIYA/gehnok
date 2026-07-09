/**
 * GEHNOK Shopify Headless Integration
 * Reusable GraphQL fragments — shared across queries and mutations.
 */

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFragment on Image {
    id
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFragment on MoneyV2 {
    amount
    currencyCode
  }
`;

export const METAFIELD_FRAGMENT = /* GraphQL */ `
  fragment MetafieldFragment on Metafield {
    id
    namespace
    key
    value
    type
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = /* GraphQL */ `
  fragment ProductVariantFragment on ProductVariant {
    id
    title
    sku
    availableForSale
    price {
      ...MoneyFragment
    }
    compareAtPrice {
      ...MoneyFragment
    }
    selectedOptions {
      name
      value
    }
    image {
      ...ImageFragment
    }
  }
`;

export const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    vendor
    tags
    availableForSale
    priceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFragment }
      maxVariantPrice { ...MoneyFragment }
    }
    images(first: 350) {
      edges {
        node { ...ImageFragment }
      }
    }
    media(first: 100) {
      edges {
        node {
          mediaContentType
          ... on Video { sources { url format } }
          ... on Model3d { sources { url format } }
          ... on ExternalVideo { embeddedUrl }
        }
      }
    }
    variants(first: 350) {
      edges {
        node { ...ProductVariantFragment }
      }
    }
    seo {
      title
      description
    }
    options {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
    craft_story: metafield(namespace: "custom", key: "craft_story") { ...MetafieldFragment }
    artisan_name: metafield(namespace: "custom", key: "artisan_name") { ...MetafieldFragment }
    certificate: metafield(namespace: "custom", key: "certificate") { ...MetafieldFragment }
    care_guide: metafield(namespace: "custom", key: "care_guide") { ...MetafieldFragment }
    material_origin: metafield(namespace: "custom", key: "material_origin") { ...MetafieldFragment }
    gemstone: metafield(namespace: "custom", key: "gemstone") { ...MetafieldFragment }
    metal: metafield(namespace: "custom", key: "metal") { ...MetafieldFragment }
    purity: metafield(namespace: "custom", key: "purity") { ...MetafieldFragment }
    hallmark: metafield(namespace: "custom", key: "hallmark") { ...MetafieldFragment }
    editorial_story: metafield(namespace: "custom", key: "editorial_story") { ...MetafieldFragment }
    artisan_hours: metafield(namespace: "custom", key: "artisan_hours") { ...MetafieldFragment }
    gemstone_type: metafield(namespace: "custom", key: "gemstone_type") { ...MetafieldFragment }
    gemstone_cut: metafield(namespace: "custom", key: "gemstone_cut") { ...MetafieldFragment }
    gemstone_carat: metafield(namespace: "custom", key: "gemstone_carat") { ...MetafieldFragment }
    gemstone_clarity: metafield(namespace: "custom", key: "gemstone_clarity") { ...MetafieldFragment }
    gemstone_color: metafield(namespace: "custom", key: "gemstone_color") { ...MetafieldFragment }
    craftsmanship_techniques: metafield(namespace: "custom", key: "craftsmanship_techniques") { ...MetafieldFragment }
    delivery_info: metafield(namespace: "custom", key: "delivery_info") { ...MetafieldFragment }
    returns_info: metafield(namespace: "custom", key: "returns_info") { ...MetafieldFragment }
    reviews: metafield(namespace: "custom", key: "reviews") { ...MetafieldFragment }
  }
`;

export const CART_LINE_FRAGMENT = /* GraphQL */ `
  fragment CartLineFragment on CartLine {
    id
    quantity
    merchandise {
      ... on ProductVariant {
        id
        title
        sku
        price { ...MoneyFragment }
        compareAtPrice { ...MoneyFragment }
        selectedOptions { name value }
        image { ...ImageFragment }
        product {
          id
          handle
          title
        }
      }
    }
    cost {
      totalAmount { ...MoneyFragment }
      subtotalAmount { ...MoneyFragment }
      amountPerQuantity { ...MoneyFragment }
      compareAtAmountPerQuantity { ...MoneyFragment }
    }
    attributes { key value }
  }
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        node { ...CartLineFragment }
      }
    }
    cost {
      totalAmount { ...MoneyFragment }
      subtotalAmount { ...MoneyFragment }
      totalTaxAmount { ...MoneyFragment }
      totalDutyAmount { ...MoneyFragment }
    }
    discountCodes {
      code
      applicable
    }
    note
    attributes { key value }
  }
`;

export const CUSTOMER_ADDRESS_FRAGMENT = /* GraphQL */ `
  fragment CustomerAddressFragment on MailingAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    country
    zip
    phone
  }
`;

export const ORDER_FRAGMENT = /* GraphQL */ `
  fragment OrderFragment on Order {
    id
    orderNumber
    processedAt
    financialStatus
    fulfillmentStatus
    totalPrice { ...MoneyFragment }
    lineItems(first: 20) {
      edges {
        node {
          title
          quantity
          variant {
            price { ...MoneyFragment }
            image { ...ImageFragment }
          }
        }
      }
    }
  }
`;

// Grouped constants for clean query injections
export const PRODUCT_QUERY_FRAGMENTS = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${METAFIELD_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;

export const CART_QUERY_FRAGMENTS = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_LINE_FRAGMENT}
  ${CART_FRAGMENT}
`;
