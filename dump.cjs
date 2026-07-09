const dotenv = require('dotenv');
dotenv.config();

const query = `
{
  products(first: 5) {
    edges {
      node {
        handle
        title
        images(first: 10) {
          edges {
            node {
              url(transform: { maxWidth: 1200 })
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              title
              image {
                url(transform: { maxWidth: 1200 })
              }
            }
          }
        }
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
