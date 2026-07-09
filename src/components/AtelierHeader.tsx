import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, Menu, X, ChevronDown, Search } from 'lucide-react';
import { useShopifyCollections } from '../hooks/useShopifyCollections';
import logoUrl from '../assets/png_logo.avif';

interface AtelierHeaderProps {
  onNavigate: (view: any, collectionHandle?: string) => void;
  currentView: string;
  activeCollectionHandle?: string | null;
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function AtelierHeader({
  onNavigate,
  currentView,
  activeCollectionHandle,
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  searchQuery = '',
  onSearchChange
}: AtelierHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ringDropdownOpen, setRingDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { collections } = useShopifyCollections(4); // Fetch top 4 for header

  const navItems: Array<{ label: string; view: any; handle?: string }> = [
    { label: 'Home', view: 'home' },
    { label: 'All Product', view: 'all-product' },
    ...collections.map(c => ({
      label: c.title,
      view: 'collection',
      handle: c.handle
    })),
    { label: 'Contact Us', view: 'contact-us' }
  ];

  return (
    <header className={`sticky top-0 z-40 w-full bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#381932] transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>

      {/* Gliding Ticker of Luxury Promises */}
      <div className="w-full bg-[#381932] text-[#FAF7F2] overflow-hidden py-1.5 border-b border-[#381932]">
        <div className="scrolling-ticker text-[8px] tracking-[0.25em] font-sans font-bold uppercase">
          <div className="flex space-x-16 pr-16 shrink-0">
            <span>Complimentary white-glove courier delivery worldwide</span>
            <span>•</span>
            <span>Bespoke consultations with lead metallurgists</span>
            <span>•</span>
            <span>Private client suite & digital viewing rooms</span>
            <span>•</span>
            <span>Handcrafted in pure Champagne Gold & flawless platinum</span>
            <span>•</span>
          </div>
          <div className="flex space-x-16 pr-16 shrink-0" aria-hidden="true">
            <span>Complimentary white-glove courier delivery worldwide</span>
            <span>•</span>
            <span>Bespoke consultations with lead metallurgists</span>
            <span>•</span>
            <span>Private client suite & digital viewing rooms</span>
            <span>•</span>
            <span>Handcrafted in pure Champagne Gold & flawless platinum</span>
            <span>•</span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20">

          {/* Left: Brand Identity */}
          <div className="flex flex-col items-center shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
            >
              <img src={logoUrl} alt="Gehnok Logo" className="h-4 sm:h-5 w-auto object-contain" />
            </button>
          </div>

          {/* Center Navigation: Main Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 justify-center">
            {navItems.map((item) => {
              const isActive = item.view === 'collection'
                ? currentView === 'collection' && item.handle === activeCollectionHandle
                : currentView === item.view;

              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.view, item.handle)}
                  className={`text-[11px] uppercase tracking-widest font-sans font-bold transition-all duration-300 py-2 cursor-pointer ${isActive
                      ? 'text-[#381932] underline decoration-2 underline-offset-4'
                      : 'text-[#8A7F7A] hover:text-[#381932]'
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Wishlist, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Elegant searchbar left of wishlist */}
            <div className="flex items-center">
              {isSearchExpanded ? (
                <div className="relative flex items-center animate-fade-in">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      if (onSearchChange) {
                        onSearchChange(e.target.value);
                      }
                      if (
                        currentView !== 'all-product' &&
                        currentView !== 'ring' &&
                        currentView !== 'braclet' &&
                        currentView !== 'earings' &&
                        currentView !== 'nackles'
                      ) {
                        onNavigate('all-product');
                      }
                    }}
                    placeholder="Search archives..."
                    className="pl-8 pr-8 py-1.5 w-36 sm:w-48 md:w-56 bg-transparent text-[#381932] border border-[#381932] focus:border-[#381932] outline-none text-[10px] uppercase tracking-wider font-sans font-medium transition-all placeholder-[#8A7F7A]/60"
                  />
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#381932]" />
                  <button
                    onClick={() => {
                      if (onSearchChange) onSearchChange('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A7F7A] hover:text-[#381932] p-0.5 cursor-pointer"
                    title="Collapse Search"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 text-[#8A7F7A] hover:text-[#381932] transition-colors cursor-pointer"
                  title="Search collections"
                >
                  <Search size={18} />
                </button>
              )}
            </div>

            <button
              onClick={onOpenWishlist}
              className="p-2 text-[#8A7F7A] hover:text-[#381932] transition-colors relative cursor-pointer"
              title="View Collection Wishlist"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#381932] rounded-full" />
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="p-2 text-[#8A7F7A] hover:text-[#381932] transition-colors relative flex items-center cursor-pointer"
              title="Open Collection Bag"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-sans font-bold text-white bg-[#381932] px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#381932] cursor-pointer ml-1"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F9F7F2] border-b border-[#381932] px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => {
                  onNavigate(item.view, item.handle);
                  setMobileMenuOpen(false);
                }}
                className={`flex justify-between items-center w-full text-left text-xs uppercase tracking-widest font-sans font-bold py-2 ${currentView === item.view ? 'text-[#381932] underline decoration-2' : 'text-[#8A7F7A]'
                  }`}
              >
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
