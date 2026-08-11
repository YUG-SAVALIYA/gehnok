function metaDimension(v) {
  if (!v) return null;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      const vals = parsed.map(item => {
        let val = typeof item === 'object' && item.value !== undefined ? item.value : item;
        // strip non-numeric characters if it's a string like "1 mm"
        if (typeof val === 'string') val = val.replace(/[^0-9.]/g, '').trim();
        return val;
      });
      return `${vals[0]}x${vals[1]}x${vals[2]} (mm)`;
    }
  } catch {}
  return v;
}
console.log(metaDimension('["1 mm", "2 mm", "3 mm"]'));
