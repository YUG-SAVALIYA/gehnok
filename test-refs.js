const q = `query { product(handle: "cushion-cut-diamond-pave-band-ring-gehnok") { 
  custom_diamond_quantity: metafield(namespace: "custom", key: "diamond_quantity") { value type }
} }`;
fetch('https://gehnok.com/api/shopify', { method: 'POST', body: JSON.stringify({ query: q }) }).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
