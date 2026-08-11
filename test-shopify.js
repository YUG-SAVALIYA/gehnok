const domain = "gehnok-jewels.myshopify.com";
const token = "586dfdde8ffecb78e52c95884c8ea9bd";
const version = "2025-01";
const endpoint = `https://${domain}/api/${version}/graphql.json`;

const query = `
{
  products(first: 5) {
    edges {
      node {
        handle
        title
        weight: metafield(namespace: "custom", key: "weight") {
          value
        }
      }
    }
  }
}
`;

fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token
  },
  body: JSON.stringify({ query })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
