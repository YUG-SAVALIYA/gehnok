import dotenv from 'dotenv';
dotenv.config();

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

async function run() {
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', SHOPIFY_CLIENT_ID!);
  body.append('client_secret', SHOPIFY_CLIENT_SECRET!);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const token = (await res.json()).access_token;
  if (!token) throw new Error("Failed to get token");

  const graphql = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

  const query = `
    query {
      products(first: 5) {
        edges {
          node {
            id
            title
            metafields(first: 20) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;
  const pRes = await fetch(graphql, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query })
  });
  
  const json = await pRes.json();
  console.log(JSON.stringify(json.data.products.edges.map((e: any) => ({
    title: e.node.title,
    metafields: e.node.metafields.edges.map((m: any) => `${m.node.namespace}.${m.node.key}: ${m.node.value}`)
  })), null, 2));
}

run().catch(console.error);
