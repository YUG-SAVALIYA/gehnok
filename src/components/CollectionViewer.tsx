import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { useShopifyCollections } from '../hooks/useShopifyCollections';
import { useShopifyMetaobject } from '../hooks/useShopifyMetaobject';
import { lenis } from '../lib/lenis';
import { Sparkles, Eye, Filter, SlidersHorizontal } from 'lucide-react';
import HoverVideo from './HoverVideo';
import ImageWithSkeleton from './ImageWithSkeleton';
import ringBannerUrl from '../assets/ring category banner.jpg';
import earringBannerUrl from '../assets/EARING category banner.jpg';
import necklaceBannerUrl from '../assets/nacles category banner.jpg';

interface CollectionViewerProps {
  onSelectProduct: (product: Product) => void;
  forcedCategory?: string; // Legacy: 'Rings' | 'Bracelets'
  collectionHandle?: string; // New: dynamic shopify collection handle
  title?: string;
  description?: string;
  searchQuery?: string;
  skipAnimation?: boolean;
}

export default function CollectionViewer({
  onSelectProduct,
  forcedCategory,
  collectionHandle,
  title,
  description,
  searchQuery = '',
  skipAnimation = false
}: CollectionViewerProps) {
  const { products: LUXURY_PRODUCTS, loading } = useShopifyProducts(
    collectionHandle ? { collection: collectionHandle } : {}
  );
  const { collections } = useShopifyCollections();
  const { data: bannerMetaobject } = useShopifyMetaobject('collection_banner', 'main');
  
  // Synchronously initialize the category to prevent frame-0 flashes
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (forcedCategory) return forcedCategory;
    if (collectionHandle && collectionHandle !== 'all') {
      const handleLower = collectionHandle.toLowerCase();
      if (handleLower === 'rings' || handleLower === 'ring') return 'Rings';
      if (handleLower === 'necklaces' || handleLower === 'necklace' || handleLower === 'nackles') return 'Necklaces';
      if (handleLower === 'earrings' || handleLower === 'earing' || handleLower === 'earings') return 'Earrings';
      if (handleLower === 'bracelets' || handleLower === 'bracelet' || handleLower === 'braclet') return 'Bracelets';
    }
    return 'All';
  });

  const [maxPrice, setMaxPrice] = useState<number>(35000);
  const [sortBy, setSortBy] = useState<string>('default');
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  
  // Cinematic Animation State
  const [mounted, setMounted] = useState(false);
  const [animPhase, setAnimPhase] = useState<'full' | 'animating' | 'done'>(skipAnimation ? 'done' : 'full');

  useEffect(() => {
    // Start text animations immediately on mount
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // Lock lenis scrolling without hiding scrollbar during cinematic animation
    if (animPhase === 'full' || animPhase === 'animating') {
      lenis.stop();
    } else {
      lenis.start();
    }

    if (animPhase === 'full') {
      const t1 = setTimeout(() => setAnimPhase('animating'), 1000); // 1.2s pause for text to reveal
      return () => {
        clearTimeout(t1);
        lenis.start();
      };
    } else if (animPhase === 'animating') {
      const t2 = setTimeout(() => setAnimPhase('done'), 1200); // 1.2s transition matches CSS
      return () => {
        clearTimeout(t2);
        lenis.start();
      };
    }
  }, [animPhase]);

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

  const activeCollection = collections.find(c => 
    c.handle === collectionHandle || 
    c.title === forcedCategory || 
    c.title === selectedCategory
  );

  // 1. Shopify Metafield (custom.banner_image)
  // 2. Local fallback image based on category
  const activeCategoryName = (forcedCategory || selectedCategory).toLowerCase();
  
  let metaobjectKey = activeCategoryName;
  if (activeCategoryName === 'necklaces') metaobjectKey = 'necklace';
  if (activeCategoryName === 'rings') metaobjectKey = 'ring';
  if (activeCategoryName === 'bracelets') metaobjectKey = 'bracelet';
  if (activeCategoryName === 'earrings') metaobjectKey = 'earing';

  const bgImg = (bannerMetaobject && bannerMetaobject[metaobjectKey]) || getHeaderBgImage(forcedCategory || selectedCategory);

  const categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'];


  // Sync category selection when props change
  useEffect(() => {
    if (forcedCategory) {
      setSelectedCategory(forcedCategory);
    } else if (collectionHandle && collectionHandle !== 'all') {
      const handleLower = collectionHandle.toLowerCase();
      if (handleLower === 'rings' || handleLower === 'ring') setSelectedCategory('Rings');
      else if (handleLower === 'necklaces' || handleLower === 'necklace' || handleLower === 'nackles') setSelectedCategory('Necklaces');
      else if (handleLower === 'earrings' || handleLower === 'earing' || handleLower === 'earings') setSelectedCategory('Earrings');
      else if (handleLower === 'bracelets' || handleLower === 'bracelet' || handleLower === 'braclet') setSelectedCategory('Bracelets');
      else setSelectedCategory('All');
    } else {
      setSelectedCategory('All');
    }
  }, [forcedCategory, collectionHandle]);

  // Filter and Sort products based on selections
  const filteredProducts = useMemo(() => {
    let result = LUXURY_PRODUCTS.filter(product => {
      // If collectionHandle is present, we already fetched ONLY that collection, so no need to filter by product.collection.
      // If forcedCategory is present, filter by that.
      // Otherwise use selectedCategory dropdown.
      let matchCategory = true;
      if (!collectionHandle) {
        const targetCategory = forcedCategory || selectedCategory;
        matchCategory = targetCategory === 'All' || product.collection === targetCategory;
      }
      
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
  }, [forcedCategory, collectionHandle, selectedCategory, maxPrice, searchQuery, sortBy, LUXURY_PRODUCTS]);

  // Dynamic headlines
  const pageTitle = title || (collectionHandle 
    ? `The ${collectionHandle.charAt(0).toUpperCase() + collectionHandle.slice(1).replace(/-/g, ' ')} Collection`
    : forcedCategory 
      ? `The ${forcedCategory} Collection` 
      : 'Atelier Curated Collections');

  const pageDesc = description || (collectionHandle || forcedCategory 
    ? `Explore our patient, bespoke hand-cast pieces forged to high-luxury museum standards.` 
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
          forceHover={hoveredProductId === product.id}
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
    <section className="animate-fade-in bg-[#381932] relative">
      
        {/* Full-Width Segment Title & Subtext with Luxury Background Image Banner */}
        <div 
          className={`relative w-full flex items-center justify-center border-b border-[#381932] overflow-hidden bg-[#381932] transition-[height] duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
            animPhase === 'full' ? 'h-[100vh]' : 'h-96'
          }`}
        >
          {/* Background image */}
          <div className="absolute inset-0 z-0 bg-[#381932]">
            <ImageWithSkeleton
              src={bgImg}
              alt={pageTitle}
              className="object-cover opacity-85 transition-transform duration-1000"
              containerClassName="absolute inset-0 z-0"
              skeletonClassName="bg-transparent"
              referrerPolicy="no-referrer"
              noFade={true}
              loading="eager"
              fetchPriority="high"
            />
            {/* Soft gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
          </div>
  
          {/* Editorial Content - Direct Overlay without separate card (fully transparent background) */}
          <div 
            className={`relative z-10 max-w-2xl mx-auto px-6 py-8 text-center space-y-4 mx-4 transition-all duration-[1200ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
            }`}
          >
            <div className={`flex items-center justify-center gap-3 transition-opacity duration-1000 delay-300 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}>
              <span className="h-[1px] w-8 bg-[#F9F7F2]/60"></span>
              <span className="text-[10px] tracking-[0.3em] font-sans uppercase font-bold text-[#F9F7F2]/90">
                Haute Joaillerie
              </span>
              <span className="h-[1px] w-8 bg-[#F9F7F2]/60"></span>
            </div>
            <h2 className="text-3xl sm:text-5.5xl font-serif-luxury tracking-wide text-[#F9F7F2] font-bold drop-shadow-md">
              {pageTitle}
            </h2>
            <p className={`max-w-lg mx-auto text-xs sm:text-sm text-[#F9F7F2]/90 font-sans leading-relaxed drop-shadow-sm font-medium transition-opacity duration-1000 delay-500 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}>
              {pageDesc}
            </p>
          </div>
        </div>

      {/* GPU Accelerated Content Wrapper */}
      <div 
        className={`w-full bg-[#F9F7F2] ${
          animPhase === 'done'
            ? 'relative z-20 pt-12 pb-16'
            : `absolute left-0 right-0 z-20 pt-12 pb-16 transition-transform duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)] top-[100vh] ${
                animPhase === 'animating' ? '-translate-y-[calc(100vh-24rem)]' : 'translate-y-0'
              }`
        }`}
        style={animPhase !== 'done' ? { height: 'calc(100vh - 24rem)', overflow: 'hidden' } : {}}
      >
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
                    onClick={() => {
                      setSelectedCategory(cat);
                      let newHandle = 'all';
                      if (cat === 'Rings') newHandle = 'ring';
                      else if (cat === 'Necklaces') newHandle = 'nackles';
                      else if (cat === 'Earrings') newHandle = 'earings';
                      else if (cat === 'Bracelets') newHandle = 'braclet';
                      window.history.pushState({}, '', `/collections/${newHandle}`);
                    }}
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
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="w-full h-48 sm:h-72 bg-[#EAE8E3]/50 border border-[#381932]/10" />
                <div className="space-y-2 pl-1">
                  <div className="h-3 w-1/3 bg-[#EAE8E3]" />
                  <div className="h-5 w-3/4 bg-[#EAE8E3]" />
                  <div className="h-4 w-1/4 bg-[#EAE8E3]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-[#381932] rounded-none bg-white">
            <p className="text-sm text-[#381932] font-sans opacity-60 italic">
              No bespoke masterworks matching this specific metallurgy filter are currently resting in our vaults.
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-10"
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer space-y-4"
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId(null)}
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
                  <h3 className="text-lg font-serif-luxury font-bold tracking-tight text-[#381932] group-hover:text-[#D4AF37] transition-colors duration-500">
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
          </motion.div>
        )}

        </div>
      </div>
    </section>
  );
}
