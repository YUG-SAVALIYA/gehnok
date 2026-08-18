const q = `query { product(handle: "cushion-cut-diamond-pave-band-ring-gehnok") { 
  shopify_gemstone_type: metafield(namespace: "shopify", key: "gemstone-type") { 
    id namespace key value type 
    reference { ... on Metaobject { handle } } 
    references(first: 10) { edges { node { ... on Metaobject { handle } } } } 
  } 
  shopify_stone_shape: metafield(namespace: "shopify", key: "stone-shape") { 
    id namespace key value type 
    reference { ... on Metaobject { handle } } 
    references(first: 10) { edges { node { ... on Metaobject { handle } } } } 
  }
} }`;

fetch('https://gehnok.com/api/shopify', { method: 'POST', body: JSON.stringify({ query: q }) })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
