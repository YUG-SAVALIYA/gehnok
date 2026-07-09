import React, { useState } from 'react';
import { Award, Mail, Send } from 'lucide-react';
import logoUrl from '../assets/png_logo.avif';
import { useShopifyPolicies } from '../hooks/useShopifyPolicies';
import { useShopifyCollections } from '../hooks/useShopifyCollections';

interface AtelierFooterProps {
  onOpenPolicy?: (type: 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy') => void;
  onNavigate?: (view: any, handle?: string) => void;
}

export default function AtelierFooter({ onOpenPolicy, onNavigate }: AtelierFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { policies } = useShopifyPolicies();
  const { collections } = useShopifyCollections(4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="bg-[#381932] text-[#F9F7F2] border-t border-[#F9F7F2]/20 pt-24 pb-16 font-sans">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#F9F7F2]/10">
          
          {/* Brand & Editorial Statement */}
          <div className="md:col-span-4 space-y-6">
            <img src={logoUrl} alt="Gehnok Logo" className="h-6 sm:h-7 w-auto object-contain brightness-0 invert" />
            <p className="text-xs leading-relaxed text-[#F9F7F2]/80 font-light max-w-sm font-sans tracking-wide">
              Fine jewelry as a permanent vessel of memory. Patiently forged to heirloom standards using proprietary Champagne Alloys and Flawless Platinum.
            </p>
            <div className="flex items-center space-x-3 text-[#F9F7F2] pt-2">
              <Award size={14} className="opacity-70" />
              <span className="text-[9px] tracking-[0.25em] font-sans font-bold uppercase opacity-80">
                Au750 / Pt950 Certified Maison
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8 text-xs">
            
            {/* Column A */}
            <div className="space-y-6">
              <h4 className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#F9F7F2] border-b border-[#F9F7F2]/10 pb-2 inline-block">
                Quick Links
              </h4>
              <ul className="space-y-4 text-[#F9F7F2]/80 font-medium text-[11px] tracking-wide uppercase font-sans">
                <li><span onClick={() => onNavigate?.('all-product')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Shop All Collections</span></li>
                {collections.map(c => (
                  <li key={c.handle}>
                    <span onClick={() => onNavigate?.('collection', c.handle)} className="hover:text-[#D4AF37] transition-all cursor-pointer">
                      {c.title}
                    </span>
                  </li>
                ))}
                <li><span onClick={() => onNavigate?.('contact-us')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Private Consultations</span></li>
              </ul>
            </div>

            {/* Column B */}
            <div className="space-y-6">
              <h4 className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#F9F7F2] border-b border-[#F9F7F2]/10 pb-2 inline-block">
                Policy
              </h4>
              <ul className="space-y-4 text-[#F9F7F2]/80 font-medium text-[11px] tracking-wide uppercase font-sans">
                <li><span onClick={() => onOpenPolicy?.('privacyPolicy')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Privacy Policy</span></li>
                <li><span onClick={() => onOpenPolicy?.('shippingPolicy')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Shipping Policy</span></li>
                <li><span onClick={() => onOpenPolicy?.('termsOfService')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Terms of Service</span></li>
                <li><span onClick={() => onOpenPolicy?.('refundPolicy')} className="hover:text-[#D4AF37] transition-all cursor-pointer">Refund Policy</span></li>
              </ul>
            </div>

          </div>

          {/* Newsletter Subscribe Area */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#F9F7F2] flex items-center gap-2 border-b border-[#F9F7F2]/10 pb-2 inline-flex">
              <Mail size={12} className="text-[#F9F7F2] opacity-80" />
              Atelier Correspondence
            </h4>
            <p className="text-xs text-[#F9F7F2]/80 leading-relaxed font-light tracking-wide">
              Receive private invitations to seasonal collections, metallurgy briefings, and private exhibition viewings.
            </p>

            <form onSubmit={handleSubscribe} className="relative flex items-center mt-6 border-b border-[#F9F7F2]/30 pb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter client email address..."
                className="w-full bg-transparent text-sm text-[#F9F7F2] placeholder-[#F9F7F2]/40 focus:outline-none tracking-wide font-sans"
                required
              />
              <button
                type="submit"
                className="absolute right-0 p-1 text-[#F9F7F2] hover:text-[#D4AF37] transition-colors"
                title="Subscribe to Atelier correspondence"
              >
                <Send size={14} />
              </button>
            </form>

            {subscribed && (
              <p className="text-[10px] text-[#F9F7F2]/80 italic font-mono animate-pulse mt-2 uppercase tracking-wider">
                Subscription complete. Welcome to the registry.
              </p>
            )}
          </div>

        </div>

        {/* Bottom Details (Legals & Hallmarks) */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] text-[#F9F7F2]/60 gap-6 font-sans">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-bold uppercase tracking-wider">
            <span>© 2026 GEHNOK Digital Atelier. All privileges reserved.</span>
            <span className="hidden sm:block text-[#F9F7F2]/20">|</span>
            <span className="hover:text-[#D4AF37] cursor-pointer transition-all">Security Protocol & Privacy</span>
          </div>

          {/* Hallmarking statement */}
          <p className="text-center md:text-right text-[9px] tracking-[0.2em] uppercase font-bold text-[#F9F7F2]/50 max-w-xl leading-relaxed">
            GEHNOK operates under strictly audited conflict-free diamond standards. Champagne Gold carries the Au750 Hallmark, and Platinum features the Pt950 stamp. Registered with the GIA.
          </p>

        </div>

      </div>
    </footer>
  );
}
