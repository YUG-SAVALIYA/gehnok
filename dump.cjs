const dotenv = require('dotenv');
dotenv.config();

const query = `
{
  collections(first: 10) {
    edges {
      node {
        title
        handle
      }
    }
  }
}
`;

fetch('https://' + process.env.SHOPIFY_STORE_DOMAIN + '/api/' + process.env.SHOPIFY_API_VERSION + '/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  },
  body: JSON.stringify({ query })
})
.then(r => r.json())
.then(r => console.dir(r, {depth: null}))
.catch(console.error);
