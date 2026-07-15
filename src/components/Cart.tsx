import React, { useState } from 'react';
import { CartItem, Product } from '../types';
import { X, Trash2, ShieldCheck, Truck, Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (productId: string, metal?: string, size?: string) => void;
  onUpdateQuantity: (productId: string, quantity: number, metal?: string, size?: string) => void;
  /** Shopify Checkout URL — if provided, redirect to it on checkout click */
  checkoutUrl?: string | null;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  checkoutUrl
}: CartProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'confirming' | 'settled'>('cart');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCheckout = () => {
    if (checkoutUrl) {
      // Force the checkout to use the original myshopify.com domain 
      // instead of the custom domain (which is hosting this React app)
      let targetUrl = checkoutUrl;
      try {
        const urlObj = new URL(checkoutUrl);
        urlObj.hostname = "gehnok-jewels.myshopify.com";
        targetUrl = urlObj.toString();
      } catch (e) {}
      
      // Instantly redirect to the real Shopify checkout page
      window.location.href = targetUrl;
      setCheckoutStep('confirming');
    } else {
      // Fallback: mock flow for when Shopify is not yet configured or failed
      setCheckoutStep('confirming');
      setTimeout(() => {
        setCheckoutStep('settled');
      }, 2500);
    }
  };

  const renderProductThumbnail = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return (
        <div className="w-16 h-16 rounded-none bg-[#FFFFFF] border border-[#381932] flex items-center justify-center shrink-0 relative overflow-hidden">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover mix-blend-multiply" 
          />
        </div>
      );
    }

    let jewelColor = '#381932';
    if (product.gemstone) {
      const gColor = product.gemstone.color.toLowerCase();
      if (gColor.includes('violet') || gColor.includes('amethyst')) jewelColor = '#C18FE0';
      else if (gColor.includes('lagoon') || gColor.includes('blue')) jewelColor = '#50B3B3';
      else if (gColor.includes('green') || gColor.includes('emerald')) jewelColor = '#50C878';
    }

    return (
      <div 
        className="w-16 h-16 rounded-none bg-[#FFFFFF] border border-[#381932] flex items-center justify-center shrink-0 relative overflow-hidden"
      >
        <div className="absolute w-6 h-6 rounded-full opacity-10 blur-sm bg-[#381932]" />
        {/* Draw a tiny geometric ring representation */}
        <svg width="24" height="24" viewBox="0 0 100 100" className="relative z-10">
          <circle cx="50" cy="55" r="22" fill="none" stroke="#381932" strokeWidth="6" />
          <polygon points="50,22 58,30 50,38 42,30" fill={jewelColor} stroke="#381932" strokeWidth="1" />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-500">
      
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Cart Slider Panel */}
      <div className="relative w-full max-w-md h-full bg-[#FFFFFF] text-[#381932] flex flex-col border-l border-[#381932] shadow-2xl transition-transform duration-500 transform translate-x-0 font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-[#381932] flex items-center justify-between bg-[#FFFFFF]/40">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="text-[#381932]" size={18} />
            <div>
              <h2 className="text-sm font-sans uppercase tracking-widest text-[#381932] font-bold">
                Collection Bag
              </h2>
              <span className="text-[7px] tracking-widest font-mono uppercase text-[#8A7F7A]">
                GEHNOK Secured Settlement
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A7F7A] hover:text-[#381932] transition-colors cursor-pointer"
            title="Close bag"
          >
            <X size={18} />
          </button>
        </div>

        {checkoutStep === 'cart' && (
          <>
            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-24 space-y-4">
                  <p className="text-xs text-[#381932] uppercase tracking-widest font-sans font-bold">
                    Your Collection is Empty
                  </p>
                  <p className="text-[11px] text-[#381932]/70 italic leading-relaxed max-w-xs mx-auto font-serif">
                    You have not added any high-jewelry pieces to your viewer. Return to the galleries to examine our creations.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 divide-y divide-[#381932]">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.selectedMetal}-${item.selectedSize}`}
                      className={`flex items-start justify-between gap-4 ${index > 0 ? 'pt-6' : ''}`}
                    >
                      <div className="flex items-start space-x-4">
                        {renderProductThumbnail(item.product)}
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[#381932]">
                            {item.product.name}
                          </h4>
                          <span className="block text-[9px] font-sans text-[#381932]/70 leading-normal">
                            <span className="font-bold">Metal:</span> {item.selectedMetal || item.product.metal}
                          </span>
                          <span className="block text-[9px] font-sans text-[#381932]/70 leading-normal">
                            <span className="font-bold">Size:</span> {item.selectedSize || 'Standard'}
                          </span>
                          <span className="block text-xs text-[#381932] font-mono font-bold pt-1">
                            {formatPrice(item.product.price)} each
                          </span>
                          
                          {/* Quantity selector */}
                          <div className="flex items-center space-x-2 pt-2">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedMetal, item.selectedSize)}
                              className="w-5 h-5 bg-[#FFFFFF] text-[#381932] rounded-none flex items-center justify-center font-mono text-[10px] hover:bg-[#381932] hover:text-white transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-mono text-[#381932] font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedMetal, item.selectedSize)}
                              className="w-5 h-5 bg-[#FFFFFF] text-[#381932] rounded-none flex items-center justify-center font-mono text-[10px] hover:bg-[#381932] hover:text-white transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove item button */}
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedMetal, item.selectedSize)}
                        className="text-[#8A7F7A] hover:text-[#381932] p-1 transition-colors cursor-pointer"
                        title="Remove piece"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price block & Checkout triggers */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#FFFFFF]/40 border-t border-[#381932] space-y-4">
                
                <div className="space-y-2 text-xs border-b border-[#381932] pb-4">
                  <div className="flex justify-between">
                    <span className="text-[#381932]/70">Subtotal Valuation</span>
                    <span className="font-mono text-[#381932] font-bold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#381932]/70 flex items-center gap-1">
                      <Truck size={10} className="text-[#381932]" />
                      White-Glove Insured Courier
                    </span>
                    <span className="text-[9px] tracking-wider text-[#381932] uppercase font-bold">
                      Complimentary
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#381932]/70">Atelier VAT / Duties</span>
                    <span className="text-[9px] text-[#381932] uppercase font-bold">
                      Included
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs uppercase tracking-widest font-sans text-[#381932] font-bold">
                    Total Valuation
                  </span>
                  <span className="text-lg font-mono text-[#381932] font-bold">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 text-xs uppercase tracking-widest font-sans font-bold bg-[#381932] text-white hover:bg-transparent hover:text-[#381932] border border-[#381932] transition-all duration-300 rounded-none flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-[#FFFFFF]" />
                  <span>Secure Checkout via Shopify</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Checkout Processing (Loading overlay) */}
        {checkoutStep === 'confirming' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="inline-block relative">
              <div className="w-10 h-10 border-2 border-[#381932] border-t-transparent rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#381932]" size={14} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-sans uppercase tracking-widest text-[#381932] font-bold">
                Securing Settlement Channels
              </h3>
              <p className="text-[11px] text-[#381932]/70 italic leading-relaxed max-w-xs font-serif">
                Synchronizing GIA gemstone registers and preparing white-glove courier insurance papers for shipment...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Checkout Success */}
        {checkoutStep === 'settled' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-[#FFFFFF]">
            <div className="w-16 h-16 rounded-none bg-[#381932] border border-[#381932] flex items-center justify-center">
              <ShieldCheck size={26} className="text-white" />
            </div>

            <div className="space-y-3">
              <span className="text-[8px] tracking-widest font-mono uppercase text-[#381932]/60 font-bold">
                Maison Order Confirmed
              </span>
              <h3 className="text-xl font-serif tracking-wide text-[#381932] font-bold">
                Acquisition Locked
              </h3>
              <p className="text-xs text-[#381932]/70 leading-relaxed max-w-sm mx-auto font-serif">
                Your private collection transaction has been securely authorized. A senior Gehknok concierge has been assigned to coordinate your private delivery schedule.
              </p>
              <div className="bg-[#FFFFFF] border border-[#381932] p-4 rounded-none text-left space-y-2 mt-4 max-w-xs mx-auto">
                <p className="text-[10px] font-mono text-[#381932]">
                  <strong className="text-[#381932] uppercase font-bold">Client:</strong> Savaliya Yug
                </p>
                <p className="text-[10px] font-mono text-[#381932]">
                  <strong className="text-[#381932] uppercase font-bold">Email:</strong> savaliyayug85@gmail.com
                </p>
                <p className="text-[10px] font-mono text-[#381932]">
                  <strong className="text-[#381932] uppercase font-bold">VAT/Customs:</strong> fully secured & cleared
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutStep('cart');
                onClose();
              }}
              className="px-8 py-3 text-xs uppercase tracking-widest font-sans font-bold border border-[#381932] text-[#381932] hover:bg-[#381932] hover:text-white transition-all rounded-none cursor-pointer"
            >
              Exit Private Room
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
