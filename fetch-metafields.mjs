import fs from 'fs';

const domain = "gehnok-jewels.myshopify.com";
const token = "586dfdde8ffecb78e52c95884c8ea9bd";
const version = "2025-01"; 

const query = `
{
  products(first: 10) {
    edges {
      node {
        title
        metafields(first: 50) {
          edges {
            node {
              namespace
              key
              value
              type
            }
          }
        }
      }
    }
  }
}
`;

async function main() {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
      'Accept': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
