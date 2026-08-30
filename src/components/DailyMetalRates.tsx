import React, { useEffect, useState } from 'react';
import { getDailyMetalRates, DailyMetalRates as RatesData } from '../services/pricingService';

export default function DailyMetalRates() {
  const [rates, setRates] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDailyMetalRates()
      .then((data) => {
        if (data) {
          setRates(data);
        } else {
          setError('Daily rates currently unavailable.');
        }
      })
      .catch(() => setError('Failed to load rates.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-[#F5F5F5] p-6 border border-[#381932]/10 w-full max-w-sm">
        <div className="h-4 bg-[#381932]/10 mb-4 w-1/2"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-[#381932]/5 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !rates) {
    return (
      <div className="bg-[#F5F5F5] p-6 border border-[#381932]/10 text-[#381932] text-xs font-mono w-full max-w-sm">
        {error || 'Rates not available.'}
      </div>
    );
  }

  const formatPrice = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}/g`;
  };

  return (
    <div className="bg-[#FFFFFF] p-6 md:p-8 border border-[#381932] w-full max-w-md mx-auto font-sans text-[#381932]">
      <div className="mb-8">
        <h3 className="text-sm tracking-widest font-bold uppercase mb-4 border-b border-[#381932]/30 pb-2">
          Today's Gold Rate
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between"><span>9K</span><span className="font-bold">{formatPrice(rates.gold['9K'])}</span></div>
          <div className="flex justify-between"><span>12K</span><span className="font-bold">{formatPrice(rates.gold['12K'])}</span></div>
          <div className="flex justify-between"><span>14K</span><span className="font-bold">{formatPrice(rates.gold['14K'])}</span></div>
          <div className="flex justify-between"><span>18K</span><span className="font-bold">{formatPrice(rates.gold['18K'])}</span></div>
          <div className="flex justify-between"><span>22K</span><span className="font-bold">{formatPrice(rates.gold['22K'])}</span></div>
          <div className="flex justify-between"><span>24K</span><span className="font-bold">{formatPrice(rates.gold['24K'])}</span></div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm tracking-widest font-bold uppercase mb-4 border-b border-[#381932]/30 pb-2">
          Today's Silver Rate
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between"><span>925 Silver</span><span className="font-bold">{formatPrice(rates.silver['925'])}</span></div>
        </div>
      </div>

      <div className="text-[9px] uppercase tracking-widest text-[#381932]/60 mt-8 pt-4 border-t border-[#381932]/10">
        <div>Last Updated: {rates.updatedAt}</div>
        <div>Source: {rates.source}</div>
      </div>
    </div>
  );
}
