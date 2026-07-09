import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { Sparkles, Eye, Filter, SlidersHorizontal } from 'lucide-react';
import HoverVideo from './HoverVideo';
import ringBannerUrl from '../assets/ring category banner.jpg';
import earringBannerUrl from '../assets/EARING category banner.jpg';
import necklaceBannerUrl from '../assets/nacles category banner.jpg';

interface CollectionViewerProps {
  onSelectProduct: (product: Product) => void;
  forcedCategory?: string; // e.g., 'Rings' | 'Bracelets' | 'Earrings' | 'Necklaces'

  title?: string;
  description?: string;
  searchQuery?: string;
}

export default function CollectionViewer({
  onSelectProduct,
  forcedCategory,

  title,
  description,
  searchQuery = ''
}: CollectionViewerProps) {
  const { products: LUXURY_PRODUCTS } = useShopifyProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [maxPrice, setMaxPrice] = useState<number>(200000);

  const getHeaderBgImage = (category?: string) => {
    switch (category) {
      case 'Rings':
        return ringBannerUrl;
      case 'Necklaces':
        return necklaceBannerUrl;
      case 'Earrings':
        return earringBannerUrl;
      case 'Bracelets':
        return 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1600&q=80';
      default:
        return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80';
    }
  };

  const bgImg = getHeaderBgImage(forcedCategory || selectedCategory);

  const categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'];


  // Reset category selection when forced category changes
  useEffect(() => {
    if (forcedCategory) {
      setSelectedCategory(forcedCategory);
    } else {
      setSelectedCategory('All');
    }
  }, [forcedCategory]);

  // Filter and Sort products based on selections
  const filteredProducts = useMemo(() => {
    let result = LUXURY_PRODUCTS.filter(product => {
      const targetCategory = forcedCategory || selectedCategory;
      const matchCategory = targetCategory === 'All' || product.collection === targetCategory;
      
      // Price range filter
      const matchPrice = product.price <= maxPrice;

      // Search filter
      const matchSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.metal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.gemstone?.type && product.gemstone.type.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchPrice && matchSearch;
    });

    // Apply Sorting
    if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'new-old') {
      result.reverse(); // Simulated reverse chronological
    } else if (sortBy === 'bestselling') {
      result.sort((a, b) => a.id.localeCompare(b.id)); // Simulated sorting for bestselling
    }
    // old-new keeps default array order

    return result;
  }, [forcedCategory, selectedCategory, maxPrice, searchQuery, sortBy]);

  // Dynamic headlines
  const pageTitle = title || (forcedCategory ? `The ${forcedCategory} Collection` : 'Atelier Curated Collections');
  const pageDesc = description || (forcedCategory 
    ? `Explore our patient, bespoke hand-cast ${forcedCategory.toLowerCase()} forged to high-luxury museum standards.` 
    : 'Patiently forged in limited numbers. Filter below by category or composition to inspect our archive.');

  // Generate beautiful geometric stylized jewel representations using CSS and inline SVGs
  const renderProductIllustration = (product: Product) => {
    // 1. Check for video presence in Shopify media or HTML description
    let videoUrl: string | null = null;
    if ((product as any).media) {
      const videoMedia = (product as any).media.find((m: any) => m.mediaContentType === 'VIDEO');
      if (videoMedia && (videoMedia.url || videoMedia.sources?.[0]?.url)) {
        videoUrl = videoMedia.url || videoMedia.sources?.[0]?.url;
      }
    }
    if (!videoUrl && product.descriptionHtml) {
      const videoMatch = product.descriptionHtml.match(/<video[^>]*>.*?<source[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is) || 
                         product.descriptionHtml.match(/<video[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is);
      if (videoMatch) videoUrl = videoMatch[1];
    }

    // If Shopify has provided real studio photography, prioritize it over the CAD draft!
    if (product.images && product.images.length > 0) {
      return (
        <HoverVideo
          videoUrl={videoUrl}
          imageUrl={product.images[0]}
          alt={product.name}
          containerClassName="w-full h-48 sm:h-72 bg-transparent group"
          imageClassName="absolute inset-0 m-auto w-full h-full object-contain mix-blend-multiply z-10"
          videoClassName="absolute inset-0 m-auto w-[90%] h-[90%] object-contain mix-blend-multiply z-0 pointer-events-none"
        />
      );
    }

    const isRing = product.collection === 'Rings';
    const isNecklace = product.collection === 'Necklaces';
    const isEarrings = product.collection === 'Earrings';
    const isBracelet = product.collection === 'Bracelets';

    let jewelColor = '#F9F7F2';
    let glowColor = 'rgba(26, 26, 26, 0.03)';

    if (product.gemstone) {
      const gColor = product.gemstone.color.toLowerCase();
      if (gColor.includes('violet') || gColor.includes('amethyst')) {
        jewelColor = '#C18FE0';
      } else if (gColor.includes('lagoon') || gColor.includes('blue')) {
        jewelColor = '#50B3B3';
      } else if (gColor.includes('green') || gColor.includes('emerald')) {
        jewelColor = '#50C878';
      } else if (gColor.includes('colorless') || gColor.includes('diamond')) {
        jewelColor = '#E8F5FF';
      }
    }

    const metalColor = '#381932'; // Stark ink line drawings for all jewelry in Editorial theme

    return (
      <div 
        className="w-full h-48 sm:h-72 flex items-center justify-center bg-[#EAE8E3] border border-[#381932] rounded-none relative overflow-hidden transition-colors duration-500"
        style={{ boxShadow: `inset 0 0 24px ${glowColor}` }}
      >
        {/* Fine crosshairs typical of Editorial CAD drafts */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#381932" strokeWidth="0.5" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#381932" strokeWidth="0.5" />
        </div>

        {/* Dynamic Vector Artwork */}
        <svg width="140" height="140" viewBox="0 0 100 100" className="relative z-10 transition-transform duration-1000 group-hover:scale-105">
          {isRing && (
            <g>
              {/* Outer band */}
              <circle cx="50" cy="55" r="24" fill="none" stroke={metalColor} strokeWidth="2.5" />
              {/* Inner ring core */}
              <circle cx="50" cy="55" r="19.5" fill="none" stroke={metalColor} strokeWidth="0.5" opacity="0.6" />
              {/* Crown setting claws */}
              <path d="M42 32 L50 42 L58 32" fill="none" stroke={metalColor} strokeWidth="1.5" />
              {/* Floating gem */}
              {product.gemstone && (
                <polygon points="50,22 59,31 50,40 41,31" fill={jewelColor} stroke="#381932" strokeWidth="1" />
              )}
            </g>
          )}

          {isNecklace && (
            <g>
              {/* Choker loop */}
              <path d="M15,30 Q50,75 85,30" fill="none" stroke={metalColor} strokeWidth="1.5" strokeDasharray="2,2" />
              {/* Fine drop chain */}
              <line x1="50" y1="52.5" x2="50" y2="65" stroke={metalColor} strokeWidth="1" />
              {/* Gem Drop */}
              <polygon points="50,65 57,75 50,85 43,75" fill={jewelColor} stroke="#381932" strokeWidth="1" />
            </g>
          )}

          {isEarrings && (
            <g>
              {/* Left ear stud */}
              <circle cx="32" cy="40" r="4" fill="none" stroke={metalColor} strokeWidth="2" />
              <polygon points="32,44 38,52 32,60 26,52" fill={jewelColor} stroke="#381932" strokeWidth="1" />
              {/* Right ear stud */}
              <circle cx="68" cy="40" r="4" fill="none" stroke={metalColor} strokeWidth="2" />
              <polygon points="68,44 74,52 68,60 62,52" fill={jewelColor} stroke="#381932" strokeWidth="1" />
              {/* Linking wire */}
              <path d="M32,38 L32,32 M68,38 L68,32" stroke={metalColor} strokeWidth="0.75" opacity="0.7" />
            </g>
          )}

          {isBracelet && (
            <g>
              {/* Sculptural wrist cuff */}
              <path d="M20,50 Q50,20 80,50 Q50,80 20,50" fill="none" stroke={metalColor} strokeWidth="3" strokeLinecap="round" />
              <path d="M26,50 Q50,26 74,50" fill="none" stroke="#FAF7F2" strokeWidth="0.75" opacity="0.6" />
              {/* Accent diamonds on band */}
              <circle cx="35" cy="42" r="1.5" fill="#381932" />
              <circle cx="50" cy="38" r="1.5" fill="#381932" />
              <circle cx="65" cy="42" r="1.5" fill="#381932" />
            </g>
          )}
        </svg>

      </div>
    );
  };

  return (
    <section className="pb-16 bg-[#F9F7F2] animate-fade-in">
      
        {/* Full-Width Segment Title & Subtext with Luxury Background Image Banner */}
        <div className="relative w-full h-96 flex items-center justify-center border-b border-[#381932] mb-12 overflow-hidden bg-[#381932]">
          {/* Background image */}
          <div className="absolute inset-0 z-0 bg-black">
            <img 
              src={bgImg} 
              alt={pageTitle} 
              className="w-full h-full object-cover opacity-85 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            {/* Soft gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
          </div>
  
          {/* Editorial Content - Direct Overlay without separate card (fully transparent background) */}
          <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 text-center space-y-4 animate-fade-in mx-4">
            <div className="flex items-center justify-center gap-3">
              <span className="h-[1px] w-8 bg-[#F9F7F2]/60"></span>
              <span className="text-[10px] tracking-[0.3em] font-sans uppercase font-bold text-[#F9F7F2]/90">
                Haute Joaillerie
              </span>
              <span className="h-[1px] w-8 bg-[#F9F7F2]/60"></span>
            </div>
            <h2 className="text-3xl sm:text-5.5xl font-serif-luxury tracking-wide text-[#F9F7F2] font-bold drop-shadow-md">
              {pageTitle}
            </h2>
            <p className="max-w-lg mx-auto text-xs sm:text-sm text-[#F9F7F2]/90 font-sans leading-relaxed drop-shadow-sm font-medium">
              {pageDesc}
            </p>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Curated Filter Bar System */}
        <div className="border-t border-b border-[#381932] py-6 mb-12 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* Left Side: Collection Filter - Only shown if not forced category */}
            {!forcedCategory ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] tracking-[0.2em] font-sans text-[#381932] uppercase mr-3 flex items-center gap-1.5 font-bold">
                  <Filter size={10} />
                  Category:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-[10px] tracking-wider font-sans uppercase font-bold transition-all duration-300 rounded-none border border-[#381932] cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#381932] text-[#F9F7F2]'
                        : 'bg-transparent text-[#381932] hover:bg-[#381932] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[9px] tracking-[0.2em] font-sans text-[#381932]/60 uppercase font-bold">
                  Displaying: {forcedCategory}
                </span>
              </div>
            )}

            {/* Right Side: Sorting Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] tracking-[0.2em] font-sans text-[#381932] uppercase mr-3 flex items-center gap-1.5 font-bold font-mono">
                <SlidersHorizontal size={10} />
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border border-[#381932] text-[10px] tracking-wider font-sans uppercase font-bold text-[#381932] px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#381932]"
              >
                <option value="default">Default</option>
                <option value="price-high">Price High to Low</option>
                <option value="price-low">Price Low to High</option>
                <option value="new-old">New to Old</option>
                <option value="old-new">Old to New</option>
                <option value="bestselling">Bestselling</option>
              </select>
            </div>

          </div>

          {/* Price Range Filter System as requested */}
          <div className="pt-4 border-t border-[#381932]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Custom Interactive Price Range Slider */}
            <div className="flex items-center gap-4 w-full">
              <span className="text-[9px] tracking-[0.15em] font-sans font-bold text-[#381932]/60 uppercase shrink-0">
                Price Ceiling Slider:
              </span>
              <input
                type="range"
                min="0"
                max="200000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#381932] cursor-pointer h-1 bg-[#381932]/10 transition-colors"
              />
              <span className="text-[11px] font-mono font-bold text-[#381932] whitespace-nowrap bg-white border border-[#381932]/30 px-3 py-1 min-w-[120px] text-center">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(maxPrice)}
              </span>
            </div>

          </div>
        </div>

        {/* Product Grid of Masterworks */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-[#381932] rounded-none bg-white">
            <p className="text-sm text-[#381932] font-sans opacity-60 italic">
              No bespoke masterworks matching this specific metallurgy filter are currently resting in our vaults.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-10">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer space-y-4"
              >
                {/* Visual Frame */}
                {renderProductIllustration(product)}

                {/* Info Text block */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center justify-between text-[9px] tracking-widest font-sans uppercase font-bold text-[#381932] opacity-60">
                    <span>{product.purity} {product.metal}</span>
                    {product.gemstone && (
                      <span className="flex items-center space-x-1 font-mono text-[8px]">
                        <Sparkles size={8} />
                        <span>{product.gemstone.carat} ct</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif-luxury font-bold tracking-tight text-[#381932] group-hover:line-through transition-all duration-300">
                    {product.name}
                  </h3>
                  <p className="text-xs font-mono text-[#381932]/70">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
