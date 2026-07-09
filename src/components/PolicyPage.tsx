import React, { useEffect } from 'react';
import { useShopifyPolicies } from '../hooks/useShopifyPolicies';
import { Shield, Sparkles } from 'lucide-react';

interface PolicyPageProps {
  policyType: 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy' | null;
  onBackToHome: () => void;
}

export default function PolicyPage({ policyType, onBackToHome }: PolicyPageProps) {
  const { policies, loading, error } = useShopifyPolicies();
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [policyType]);

  const policy = policyType ? policies?.[policyType] : null;

  return (
    <div className="bg-[#FAF8F4] min-h-screen pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back button */}
        <button 
          onClick={onBackToHome}
          className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#8A7F7A] hover:text-[#381932] transition-colors mb-12 flex items-center gap-2 cursor-pointer"
        >
          &larr; Return to Atelier
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-[#381932] border-t-transparent rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#381932]" size={16} />
            </div>
            <p className="text-[10px] tracking-widest font-mono uppercase text-[#381932]/70 font-bold animate-pulse">
              Retrieving Legal Documentation...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white border border-[#381932]/20 p-12 text-center space-y-4">
            <Shield className="mx-auto text-[#381932]/40 mb-4" size={32} />
            <h2 className="text-xl font-serif text-[#381932] font-bold">Policy Unavailable</h2>
            <p className="text-sm text-[#381932]/70 font-serif">
              The requested policy could not be retrieved from the Shopify servers. 
            </p>
            <p className="text-xs font-mono text-red-800/80 mt-4 p-4 bg-red-50">{error}</p>
            <p className="text-[10px] text-[#381932]/50 italic pt-4">
              Developer Note: Ensure you have completely restarted your development server (`npm run dev`) so that the new /api/shopify/policies backend route is active.
            </p>
          </div>
        ) : policy ? (
          <div className="bg-white border border-[#381932]/10 p-8 sm:p-16 shadow-sm">
            <div className="border-b border-[#381932]/20 pb-8 mb-8 text-center">
              <h1 className="text-2xl sm:text-4xl font-serif text-[#381932] tracking-tight font-bold mb-4">
                {policy.title}
              </h1>
              <div className="w-12 h-[1px] bg-[#381932] mx-auto" />
            </div>
            <div 
              className="policy-content w-full"
              dangerouslySetInnerHTML={{ __html: policy.body }}
            />
          </div>
        ) : (
          <div className="text-center py-32 space-y-4">
            <h2 className="text-xl font-serif text-[#381932] font-bold">Policy Not Found</h2>
            <p className="text-sm text-[#381932]/70 font-serif">
              The policy you are looking for does not exist or has not been published in Shopify.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
