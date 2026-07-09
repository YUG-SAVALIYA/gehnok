const dotenv = require('dotenv');
dotenv.config();

const query = `
{
  product(handle: "14k-gold-double-heart-ruby-screw-back-earrings") {
    handle
    options { name optionValues { name } }
    images(first: 10) { edges { node { url(transform: { maxWidth: 1200 }) } } }
    variants(first: 10) {
      edges { node { selectedOptions { name value } image { url(transform: { maxWidth: 1200 }) } } }
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
.then(data => {
  const products = [data.data.product];
  const base = (url) => url.split('?')[0].split('/').pop() || '';
  
  for (const product of products) {
    console.log('--- Product:', product.handle);
    const allImages = product.images.edges.map(e => e.node.url);
    const anchorMap = new Map();
    
    for (const v of product.variants.edges.map(e => e.node)) {
      if (!v.image) continue;
      const metalOpt = v.selectedOptions.find(o => o.name.toLowerCase().includes('metal') || o.name.toLowerCase().includes('material') || o.name.toLowerCase().includes('color'));
      if (!metalOpt || anchorMap.has(metalOpt.value.toLowerCase())) continue;
      
      const vBase = base(v.image.url);
      const idx = allImages.findIndex(img => base(img) === vBase);
      if (idx !== -1) anchorMap.set(metalOpt.value.toLowerCase(), idx);
      console.log('Found anchor for', metalOpt.value, 'at index', idx, 'vBase:', vBase);
    }
    
    console.log('anchorMap:', Object.fromEntries(anchorMap));
    const sortedAnchors = [...new Set(anchorMap.values())].sort((a, b) => a - b);
    console.log('sortedAnchors:', sortedAnchors);
  }
})
.catch(console.error);
