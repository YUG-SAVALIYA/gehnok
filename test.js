async function check() {
  const query = `{
    metaobject(handle: { type: "homepage_assets", handle: "main" }) {
      fields {
        key
        reference {
          ... on MediaImage {
            image { url }
          }
          ... on GenericFile {
            url
          }
        }
      }
    }
  }`;
  
  const res = await fetch('https://gehnok-jewels.myshopify.com/api/2026-01/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': '586dfdde8ffecb78e52c95884c8ea9bd'
    },
    body: JSON.stringify({ query })
  });
  
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

check();
