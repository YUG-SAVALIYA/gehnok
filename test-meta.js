function metaWeight(metafield) {
  const v = metafield?.value;
  if (!v) return null;
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed.value === 'number') {
      let unit = '';
      if (parsed.unit === 'GRAMS') unit = 'g';
      else if (parsed.unit === 'KILOGRAMS') unit = 'kg';
      else if (parsed.unit === 'OUNCES') unit = 'oz';
      else if (parsed.unit === 'POUNDS') unit = 'lb';
      else if (parsed.unit) unit = String(parsed.unit).toLowerCase();
      
      return `${parsed.value}${unit}`;
    }
  } catch {
    // fall through
  }
  return v;
}

console.log(metaWeight({ value: '{"value":30.0,"unit":"GRAMS"}' }));
console.log(metaWeight({ value: '{"value":45,"unit":"KILOGRAMS"}' }));
console.log(metaWeight({ value: '{"value": 30.5}' }));
console.log(metaWeight({ value: 'Not JSON' }));
console.log(metaWeight(null));
