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
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  const token = (await res.json()).access_token;
  
  const query = `
    query {
      nodes(ids: ["gid://shopify/Product/14976304054639", "gid://shopify/Product/14976330596719", "gid://shopify/Product/14979346071919", "gid://shopify/Product/14991353741679", "gid://shopify/Product/15038851285359"]) {
        ... on Product {
          title
        }
      }
    }
  `;
  const pRes = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query })
  });
  console.log(JSON.stringify(await pRes.json(), null, 2));
}

run().catch(console.error);
