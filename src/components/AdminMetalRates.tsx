import React, { useEffect, useState } from 'react';

export default function AdminMetalRates() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metal-rates/debug')
      .then(res => res.json())
      .then(data => {
        setDebugData(data);
        setLoading(false);
      });
  }, []);

  const forceFetch = async () => {
    setLoading(true);
    await fetch('/api/metal-rates/force-fetch', { method: 'POST' });
    const res = await fetch('/api/metal-rates/debug');
    const data = await res.json();
    setDebugData(data);
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-xs font-mono">Loading Debug Data...</div>;

  if (!debugData) return <div className="p-4 text-xs font-mono text-red-500">Failed to load debug data.</div>;

  const { rates, env_configured } = debugData;

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 text-xs font-mono max-w-3xl mx-auto my-8">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300">
        <h2 className="text-lg font-bold text-gray-800">Admin Debug: Metal Pricing System</h2>
        <button 
          onClick={forceFetch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Force Manual Fetch
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">System Status</h3>
          <ul className="space-y-1">
            <li><strong>API Key Configured:</strong> <span className={env_configured ? "text-green-600" : "text-red-600"}>{env_configured ? 'YES' : 'NO'}</span></li>
            <li><strong>Current Active Date:</strong> {rates?.date || 'N/A'}</li>
            <li><strong>Timezone:</strong> {rates?.timezone || 'N/A'}</li>
            <li><strong>Fetch Status:</strong> {rates?.status || 'N/A'}</li>
            <li><strong>API Timestamp:</strong> {rates?.fetchedAt ? new Date(rates.fetchedAt).toLocaleString() : 'N/A'}</li>
            <li><strong>Last Error:</strong> <span className="text-red-600">{rates?.lastError || 'None'}</span></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Raw API Data (IBJA)</h3>
          <ul className="space-y-1">
            <li><strong>Source:</strong> {rates?.source || 'N/A'}</li>
            <li><strong>Gold 999:</strong> {rates?.rawRates?.gold999 ? `₹${rates.rawRates.gold999}` : 'N/A'}</li>
            <li><strong>Silver 999:</strong> {rates?.rawRates?.silver999 ? `₹${rates.rawRates.silver999}` : 'N/A'}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Calculated Gold Rates</h3>
          {rates?.gold ? (
            <ul className="space-y-1">
              <li><strong>9K:</strong> ₹{rates.gold['9K'].toFixed(4)} / g</li>
              <li><strong>12K:</strong> ₹{rates.gold['12K'].toFixed(4)} / g</li>
              <li><strong>14K:</strong> ₹{rates.gold['14K'].toFixed(4)} / g</li>
              <li><strong>18K:</strong> ₹{rates.gold['18K'].toFixed(4)} / g</li>
              <li><strong>22K:</strong> ₹{rates.gold['22K'].toFixed(4)} / g</li>
              <li><strong>24K:</strong> ₹{rates.gold['24K'].toFixed(4)} / g</li>
            </ul>
          ) : <span>N/A</span>}
        </div>
        
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Calculated Silver Rates</h3>
          {rates?.silver ? (
            <ul className="space-y-1">
              <li><strong>925 Silver:</strong> ₹{rates.silver['925'].toFixed(4)} / g</li>
            </ul>
          ) : <span>N/A</span>}
        </div>
      </div>
    </div>
  );
}
