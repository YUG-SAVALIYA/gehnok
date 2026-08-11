fetch('http://localhost:3000/api/shopify/products?first=1')
  .then(res => res.json())
  .then(data => {
    if (data.products && data.products.length > 0) {
      console.log(JSON.stringify(data.products[0], null, 2));
    } else {
      console.log('No products returned', data);
    }
  })
  .catch(err => console.error('Fetch error:', err));
