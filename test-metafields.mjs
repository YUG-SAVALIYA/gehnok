import fs from 'fs';

const domain = "gehnok-jewels.myshopify.com";
const token = "586dfdde8ffecb78e52c95884c8ea9bd";
const version = "2025-01"; 

const query = `
{
  product(handle: "cushion-cut-diamond-pave-band-ring-gehnok") {
    title
  }
}
`;

fetch(`https://${domain}/api/${version}/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
    'Accept': 'application/json'
  },
  body: JSON.stringify({ query })
}).then(res => res.json()).then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);
