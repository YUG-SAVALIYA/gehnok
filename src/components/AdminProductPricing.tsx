import React, { useState, useEffect } from 'react';
import { ProductPricingConfig, PricingResult, PricingHistoryRecord } from '../backend/productPricingEngine';

export default function AdminProductPricing() {
  const [config, setConfig] = useState<ProductPricingConfig>({
    product_id: 'gid://shopify/Product/123456',
    variant_id: 'gid://shopify/ProductVariant/654321',
    metal_type: 'Gold',
    metal_purity: '18K',
    metal_weight_g: 2.35,
    making_charge: 500,
    tax_percentage: 3
  });

  const [preview, setPreview] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PricingHistoryRecord[]>([]);

  useEffect(() => {
    calculatePreview();
  }, [config]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const calculatePreview = async () => {
    try {
      const res = await fetch('/api/products/test/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.result);
        setError(null);
      } else {
        setError(data.error);
        setPreview(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReprice = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/test/pricing/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Successfully updated Shopify variant price!');
        fetchHistory();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/products/test/pricing/history');
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history);
      }
    } catch (err) {}
  };

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm bg-gray-50 border border-gray-300">
      
      {/* Configuration Form */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Product Pricing Config (Simplified)</h2>
        <p className="text-xs text-gray-500 mb-4 font-sans">
          Your product already uses custom.metal, custom.purity, and custom.weight.
          To enable automatic pricing, you just need to create the 'custom.making_charge' and 'custom.tax' metafields!
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              Metal Type (custom.metal):
              <select value={config.metal_type} onChange={e => setConfig({...config, metal_type: e.target.value})} className="border p-1 mt-1">
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Rose Gold">Rose Gold</option>
                <option value="White Gold">White Gold</option>
              </select>
            </label>
            <label className="flex flex-col">
              Weight (g) (custom.weight):
              <input type="number" step="0.01" value={config.metal_weight_g} onChange={e => setConfig({...config, metal_weight_g: parseFloat(e.target.value)})} className="border p-1 mt-1" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              Purity (custom.purity):
              <select value={config.metal_purity} onChange={e => setConfig({...config, metal_purity: e.target.value})} className="border p-1 mt-1">
                <option value="18K">18K</option>
                <option value="14K">14K</option>
                <option value="22K">22K</option>
                <option value="925">925</option>
              </select>
            </label>
            <label className="flex flex-col">
              Making Charge (custom.making_charge):
              <input type="number" step="0.01" value={config.making_charge} onChange={e => setConfig({...config, making_charge: parseFloat(e.target.value)})} className="border p-1 mt-1" />
            </label>
          </div>

          <label className="flex flex-col border-t border-gray-200 pt-4">
            Tax Percentage (%):
            <input type="number" step="0.1" value={config.tax_percentage} onChange={e => setConfig({...config, tax_percentage: parseFloat(e.target.value)})} className="border p-1 mt-1 w-1/2" />
          </label>
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Live Calculation Preview</h2>
        
        {error ? (
          <div className="text-red-600 bg-red-50 p-4 border border-red-200 rounded">{error}</div>
        ) : preview ? (
          <div className="bg-white p-6 border border-gray-200 shadow-sm text-sm space-y-3">
            <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
              <span className="font-bold">Specification:</span>
              <span>{preview.metal.purity} {preview.metal.type} ({preview.metal.weight_g}g)</span>
            </div>
            
            <div className="flex justify-between text-blue-800">
              <span>Daily Rate Used:</span>
              <span>{formatINR(preview.metal.daily_rate)} / g</span>
            </div>

            <div className="flex justify-between pt-2">
              <span>Metal Value:</span>
              <span>{formatINR(preview.metal.metal_value)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Making Charge:</span>
              <span>+ {formatINR(preview.making_charge)}</span>
            </div>

            <div className="flex justify-between font-bold border-t border-gray-300 pt-2">
              <span>Subtotal:</span>
              <span>{formatINR(preview.subtotal)}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Tax / GST ({config.tax_percentage}%):</span>
              <span>+ {formatINR(preview.tax)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-3 mt-3">
              <span>FINAL PRICE:</span>
              <span>{formatINR(preview.final_price)}</span>
            </div>

            <button 
              onClick={handleReprice}
              disabled={loading}
              className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded transition shadow"
            >
              {loading ? 'Updating Shopify...' : 'Confirm & Update Shopify Variant'}
            </button>
          </div>
        ) : (
          <div className="text-gray-500">Loading preview...</div>
        )}

        {/* History Display */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold border-b border-gray-300 pb-2 mb-4">Pricing History</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {history.slice().reverse().map((h, i) => (
                <div key={i} className="bg-gray-100 p-3 text-xs border border-gray-200">
                  <div className="flex justify-between font-bold mb-1">
                    <span>{new Date(h.updated_at).toLocaleDateString()}</span>
                    <span>{formatINR(h.final_price)}</span>
                  </div>
                  <div className="text-gray-600">
                    {h.purity} • {h.metal_weight}g • Rate: {formatINR(h.metal_rate_used)}/g
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
