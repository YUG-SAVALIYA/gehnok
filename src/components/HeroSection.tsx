import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Compass, Sparkles, ChevronLeft, ChevronRight, 
  RotateCcw, Globe, Shield, ChevronDown, ChevronUp, Star, BookOpen 
} from 'lucide-react';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { useShopifyMetaobject } from '../hooks/useShopifyMetaobject';
import { useShopifyArticles } from '../hooks/useShopifyArticles';
import { useShopifyCollections } from '../hooks/useShopifyCollections';
import { Product } from '../types';
import CollectionViewer from './CollectionViewer';
import ImageWithSkeleton from './ImageWithSkeleton';
import HoverVideo from './HoverVideo';
import slide1 from '../assets/First_Web_baner_jpg.webp';
import slide2 from '../assets/First_Web_baner_2.webp';
import slide3 from '../assets/third_Web_baner.webp';
import slide4 from '../assets/fourth_web_baner.webp';
import slide5 from '../assets/fifth_Web_baner.webp';
import slide6 from '../assets/sixth_Web_baner.webp';
import ringBannerUrl from '../assets/ring category banner.jpg';
import earringBannerUrl from '../assets/EARING category banner.jpg';
import necklaceBannerUrl from '../assets/nacles category banner.jpg';
import collectionRingUrl from '../assets/collection/RING_jpg.webp';
import collectionNecklaceUrl from '../assets/collection/NACKLES_jpg.webp';
import collectionEarringUrl from '../assets/collection/EARINGS_jpg.webp';
import collectionBraceletUrl from '../assets/collection/BRACLET_jpg.webp';
import returnSvg from '../assets/SVG/15_Day_Return.svg';
import globalSvg from '../assets/SVG/Global_Online_Jeweler.svg';
import certifiedSvg from '../assets/SVG/SGL_IGI_Certified.svg';
import secureCheckoutSvg from '../assets/SVG/Secure_checkout.svg';

interface HeroSectionProps {
  onEnterCollections: () => void;
  onEnterConcierge: () => void;
  onEnterAtelier: () => void;
  onNavigate: (view: any, handle?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function HeroSection({
  onEnterCollections,
  onEnterConcierge,
  onEnterAtelier,
  onNavigate,
  onSelectProduct
}: HeroSectionProps) {
  const { products: LUXURY_PRODUCTS, loading: productsLoading } = useShopifyProducts();
  const { data: homepageAssets } = useShopifyMetaobject('homepage_assets', 'main');
  const { articles: allBlogs, loading: blogsLoading } = useShopifyArticles(3);
  const { collections, loading: collectionsLoading } = useShopifyCollections(4);
  
  // Preload the metal colors into browser cache quietly in the background 
  // so they are instantly ready when navigating to the product viewer
  useShopifyMetaobject('metal_colors', 'main');
  
  // Slide state for Section 1 (Sliding Bar)
  const [activeSlide, setActiveSlide] = useState(0);

  // Slider data linking directly to real products but using the curated static photography banners
  const sliderItems = [
    {
      productId: 'solitaire-luminary',
      title: 'THE SOLITAIRE LUMINARY',
      subtitle: 'Floating Platinum Splendor',
      description: 'A singular, D-color flawless 1.8-carat round brilliant diamond elevated on four delicate platinum claws to capture pure ambient light.',
      price: '₹18,000',
      imageDesktop: slide1,
      imageMobile: homepageAssets?.slide_1 || slide1,
      badge: 'Platinum 950 Masterwork'
    },
    {
      productId: 'aeterna-gold-band',
      title: 'AETERNA GOLD BAND',
      subtitle: 'Seamless Golden Continuity',
      description: 'A seamless sculpture of pure 18k Champagne Gold, hand-set with a flawless line of conflict-free brilliant-cut micro-pave diamonds.',
      price: '₹4,200',
      imageDesktop: slide2,
      imageMobile: homepageAssets?.slide_2 || slide2,
      badge: 'Champagne Gold Compound'
    },
    {
      productId: 'sirens-tear-pendant',
      title: "SIREN'S TEAR PENDANT",
      subtitle: 'A Drop of Ocean Neon',
      description: 'A singular, pear-shaped rare Paraiba-type tourmaline of intense lagoon-blue color, suspended on an ultra-fine Champagne Gold chain.',
      price: '₹11,200',
      imageDesktop: slide3,
      imageMobile: homepageAssets?.slide_3 || slide3,
      badge: 'Rare Paraiba Tourmaline'
    },
    {
      productId: 'emerald-cut-eternity',
      title: 'EMERALD CUT ETERNITY',
      subtitle: 'Continuous Geometric Brilliance',
      description: 'An unbroken circle of perfectly matched emerald-cut diamonds, set in an architectural platinum frame.',
      price: '₹22,500',
      imageDesktop: slide4,
      imageMobile: homepageAssets?.slide_4 || slide4,
      badge: 'Architectural Platinum'
    }
  ];

  // Auto-play for Sliding Bar
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sliderItems.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + sliderItems.length) % sliderItems.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % sliderItems.length);
  };

  // Curated Best Sellers (Section 3) - Dynamically take products 4 to 8
  const bestSellers = LUXURY_PRODUCTS.slice(3, 7);

  // Newly Launched Products (Section 4) - Dynamically take products 8 to 12
  const newlyLaunched = LUXURY_PRODUCTS.slice(7, 11);

  // FAQ State (Section 7)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const faqs = [
    {
      question: 'How do I determine my correct sizing profile?',
      answer: 'We offer complimentary physical sizing instruments delivered directly to your home via express shipping. Alternatively, our server-side AI Concierge can guide you through precise regional conversion charts.'
    },
    {
      question: 'What makes Gehknok Champagne Gold unique?',
      answer: 'It is a proprietary metallurgy compound fusing 75% fine gold (Au750) with refined sterling silver and pure copper in a protective vacuum furnace, eliminating microscopic air bubbles and yielding a soft, peach-hued warmth that flatters all skin tones.'
    },
    {
      question: 'Is secure shipping fully insured globally?',
      answer: 'Yes. Every Gehknok masterpiece is secured inside a locked, heavy leather coffer with tamper-evident security seals, fully covered by transit insurance, and hand-delivered directly by our white-glove courier network.'
    },
    {
      question: 'Can I customize the gemstone in a specific casting?',
      answer: 'Absolutely. We accommodate bespoke gem selection from our high-purity vaults. You can request customized metal selection or alternate stone settings by consulting our digital AI Luxury Concierge.'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="w-full bg-[#F9F7F2] text-[#381932] flex flex-col font-serif box-border">
      
      {/* ----------------- SECTION 1: SLIDING BAR (HERO CAROUSEL) ----------------- */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[800px] bg-[#381932] overflow-hidden border-b border-[#381932]">
        
        {/* Slides Container */}
        {sliderItems.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.productId}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Slide Image (Responsive with Skeleton) */}
              <ImageWithSkeleton
                src={slide.imageDesktop}
                mobileSrc={slide.imageMobile}
                alt={slide.title}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}

        {/* Sliding Navigation Controls (Prev / Next Arrows) */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-[#F9F7F2] hover:text-[#381932] text-white border border-white/20 rounded-full flex items-center justify-center transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-[#F9F7F2] hover:text-[#381932] text-white border border-white/20 rounded-full flex items-center justify-center transition-all cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2.5">
          {sliderItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === activeSlide ? 'bg-[#F9F7F2] scale-125' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

      {/* ----------------- SECTION 2: AVAILABLE CATEGORIES ----------------- */}
      <section className="py-16 sm:py-20 border-b border-[#381932]/30 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
              Atelier Vault
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-[#381932]">
              Explore Available Collections
            </h2>
            <div className="w-16 h-[1px] bg-[#381932] mx-auto mt-4" />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {collectionsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`col-skel-${idx}`} className="h-56 sm:h-80 bg-[#EAE8E3]/50 animate-pulse border border-[#381932]/10" />
              ))
            ) : (
              collections.map((cat) => (
                <div
                  key={cat.handle}
                  onClick={() => onNavigate('collection', cat.handle)}
                  className="group relative h-56 sm:h-80 bg-[#EAE8E3] border border-[#381932]/30 hover:border-[#381932] overflow-hidden flex flex-col justify-end p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {/* Background Image with Hover Zoom */}
                  <ImageWithSkeleton
                    src={cat.image?.url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80'}
                    alt={cat.title}
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    containerClassName="absolute inset-0 z-0"
                    referrerPolicy="no-referrer"
                  />
  
                  {/* Info Overlay */}
                  <div className="relative z-[2] space-y-1.5 text-[#F9F7F2] transition-transform duration-300 transform group-hover:translate-y-[-4px]">
                    <h3 className="text-2xl font-serif font-bold tracking-wide drop-shadow-md">
                      {cat.title}
                    </h3>
                    <p className="text-[10px] font-sans uppercase tracking-widest font-semibold opacity-80 drop-shadow-md">
                      {cat.description || 'Exclusive Atelier Collection'}
                    </p>
                    <div className="pt-2 text-[8px] font-mono uppercase tracking-[0.2em] flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#D4AF37] drop-shadow-md">
                      <span>Open Collection</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* ----------------- SECTION 3: BEST SELLERS ----------------- */}
      <section className="py-20 bg-[#F9F7F2] border-b border-[#381932]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#381932]/30 pb-6 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
                Acclaimed Masterpieces
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#381932] tracking-tight">
                Maison Best Sellers
              </h2>
            </div>
            <button
              onClick={onEnterCollections}
              className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#381932] border-b border-[#381932] pb-1 hover:text-opacity-70 transition-all cursor-pointer self-start md:self-auto"
            >
              Browse Full Catalog
            </button>
          </div>

          {/* Best Sellers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`bs-skel-${idx}`} className="space-y-4 animate-pulse">
                  <div className="aspect-square bg-[#EAE8E3]/50 border border-[#381932]/10" />
                  <div className="pt-4 px-2 space-y-2 text-center">
                    <div className="h-2 w-1/4 bg-[#EAE8E3] mx-auto" />
                    <div className="h-4 w-3/4 bg-[#EAE8E3] mx-auto" />
                    <div className="h-3 w-1/3 bg-[#EAE8E3] mx-auto" />
                  </div>
                </div>
              ))
            ) : (
              bestSellers.slice(0, 4).map((product) => (
                <div 
                  key={product.id}
                  className="group bg-transparent flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Product Image Panel */}
                  {(() => {
                    const videoMedia = (product as any).media?.find((m: any) => m.mediaContentType === 'VIDEO' || m.mediaContentType === 'EXTERNAL_VIDEO');
                    let videoUrl = videoMedia?.url;
                    if (!videoUrl && product.descriptionHtml) {
                      const match = product.descriptionHtml.match(/<video[^>]*>.*?<source[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is) || product.descriptionHtml.match(/<video[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is);
                      if (match && match[1]) {
                        videoUrl = match[1];
                      }
                    }
                    
                    return (
                      <HoverVideo
                        videoUrl={videoUrl}
                        imageUrl={product.images[0]}
                        alt={product.name}
                        containerClassName="aspect-square bg-[#FAF8F4] flex items-center justify-center"
                        imageClassName="absolute inset-0 m-auto w-full h-full object-contain p-6 z-10"
                        videoClassName="absolute inset-0 m-auto w-full h-full object-cover z-0 pointer-events-none"
                        onClick={() => onSelectProduct(product)}
                      />
                    );
                  })()}
  
                  {/* Product Details Panel - Elegant & Compact */}
                  <div className="pt-4 px-2 space-y-1.5 text-center bg-transparent">
                    <div className="text-[#381932]/40 text-[9px] uppercase tracking-[0.3em] font-sans font-bold pb-1">
                      Best Seller
                    </div>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-[#381932] leading-snug group-hover:text-[#D4AF37] transition-colors duration-500">
                      {product.name}
                    </h3>
                    <div className="flex flex-col items-center justify-center gap-1.5 pt-1 relative">
                      <span className="text-xs font-mono font-bold text-[#381932]/80 group-hover:opacity-0 transition-opacity duration-500">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#381932] font-sans font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 absolute inset-0 flex items-center justify-center">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* ----------------- SECTION 4: BIG BANNER WITH EXPLORE & NEWLY LAUNCHED ----------------- */}
      <section className="bg-white">
        
        {/* Big Promotional Banner */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[800px] bg-[#381932] border-b border-[#381932]">
          <div className="absolute inset-0 bg-[#381932]/50 z-[1]" />
          <ImageWithSkeleton
            src={homepageAssets?.slide_5 || slide5}
            alt="The Celestial Alchemy Promo"
            className="object-cover"
            containerClassName="absolute inset-0 z-0"
            referrerPolicy="no-referrer"
          />

          <div className="absolute inset-0 z-[2] flex items-center justify-center text-center">
            <div className="max-w-3xl mx-auto px-4 space-y-6">
              <span className="text-[9px] tracking-[0.4em] font-sans font-bold uppercase text-[#FAF8F4]/80 block">
                Exclusive Season Release
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-white tracking-tight leading-tight">
                THE CELESTIAL ALCHEMY
              </h2>
              <p className="text-xs sm:text-sm text-white/95 max-w-xl mx-auto leading-relaxed font-sans font-light">
                Explore a limited-run private release of vacuum-compounded alloys, ethically sourced violet amethysts, and flawless certified solitaire diamonds. Handcrafted by master jewelers.
              </p>
              <div className="pt-2">
                <button
                  onClick={onEnterCollections}
                  className="px-8 py-4 bg-[#F9F7F2] text-[#381932] font-sans text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#381932] hover:text-white transition-all duration-300 border border-[#F9F7F2] cursor-pointer"
                >
                  Explore Full Catalog
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Newly Launched Products */}
        <div className="py-20 bg-[#FAF8F4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
                Fresh From The Atelier Forge
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#381932] tracking-tight">
                Newly Launched Designs
              </h2>
              <div className="w-12 h-[1px] bg-[#381932] mx-auto mt-3" />
            </div>

            {/* Newly Launched Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`nl-skel-${idx}`} className="space-y-4 animate-pulse">
                    <div className="aspect-square bg-[#EAE8E3]/50 border border-[#381932]/10" />
                    <div className="pt-4 px-2 space-y-2 text-center">
                      <div className="h-2 w-1/4 bg-[#EAE8E3] mx-auto" />
                      <div className="h-4 w-3/4 bg-[#EAE8E3] mx-auto" />
                      <div className="h-3 w-1/3 bg-[#EAE8E3] mx-auto" />
                    </div>
                  </div>
                ))
              ) : (
                newlyLaunched.slice(0, 4).map((product) => (
                  <div 
                    key={product.id}
                    className="group bg-transparent flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    {/* Product Image Panel */}
                    {(() => {
                      const videoMedia = (product as any).media?.find((m: any) => m.mediaContentType === 'VIDEO' || m.mediaContentType === 'EXTERNAL_VIDEO');
                      let videoUrl = videoMedia?.url;
                      if (!videoUrl && product.descriptionHtml) {
                        const match = product.descriptionHtml.match(/<video[^>]*>.*?<source[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is) || product.descriptionHtml.match(/<video[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is);
                        if (match && match[1]) {
                          videoUrl = match[1];
                        }
                      }
                      
                      return (
                        <HoverVideo
                          videoUrl={videoUrl}
                          imageUrl={product.images[0]}
                          alt={product.name}
                          containerClassName="aspect-square bg-[#FAF8F4] flex items-center justify-center"
                          imageClassName="absolute inset-0 m-auto w-full h-full object-contain p-6 z-10"
                          videoClassName="absolute inset-0 m-auto w-full h-full object-cover z-0 pointer-events-none"
                          onClick={() => onSelectProduct(product)}
                        />
                      );
                    })()}
  
                    {/* Compact Product Details Panel */}
                    <div className="pt-4 px-2 space-y-1.5 text-center bg-transparent">
                      <div className="text-[#D4AF37] text-[9px] uppercase tracking-[0.3em] font-sans font-bold pb-1">
                        New Release
                      </div>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-[#381932] leading-snug group-hover:text-[#D4AF37] transition-colors duration-500">
                        {product.name}
                      </h3>
                      <div className="flex flex-col items-center justify-center gap-1.5 pt-1 relative">
                        <span className="text-xs font-mono font-bold text-[#381932]/80 group-hover:opacity-0 transition-opacity duration-500">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#381932] font-sans font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 absolute inset-0 flex items-center justify-center">
                          View Details
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </section>

      {/* ----------------- SECTION 5: COUNTS (STATISTICS PANEL) - REDESIGNED ----------------- */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden py-24 border-b border-[#381932]">
        
        {/* Full-screen Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#FFFDF8] via-[#FDE4C3] to-[#C97B34]" />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Headings, Cards & CTA */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <div className="space-y-4">
                <span className="text-[10px] tracking-[0.4em] font-sans font-black uppercase text-[#381932] block">
                  JEWELS AS UNIQUE AS YOU
                </span>
                <h2 className="text-4xl sm:text-6xl font-serif font-black text-[#2D142C] tracking-tight leading-[1.05] max-w-2xl">
                  Commitment, Forever, In Every Sparkling Jewel
                </h2>
                <div className="w-16 h-[2px] bg-[#381932]/60 mt-4" />
              </div>

              {/* Three clean white cards as shown in reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                
                {/* Card 1 */}
                <div className="bg-white p-6 sm:p-8 shadow-xl border border-[#381932]/10 rounded-none flex flex-col justify-center items-center text-center group hover:border-[#381932] transition-colors duration-300">
                  <span className="block text-4xl sm:text-5xl font-serif font-black text-[#2D142C] tracking-tighter">
                    20K
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider font-sans font-bold text-[#381932]/60 mt-2">
                    Worldwide Branches
                  </span>
                  <div className="w-6 h-[1px] bg-[#381932]/20 mt-3 group-hover:w-12 transition-all duration-300" />
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 sm:p-8 shadow-xl border border-[#381932]/10 rounded-none flex flex-col justify-center items-center text-center group hover:border-[#381932] transition-colors duration-300">
                  <span className="block text-4xl sm:text-5xl font-serif font-black text-[#2D142C] tracking-tighter">
                    300+
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider font-sans font-bold text-[#381932]/60 mt-2">
                    Unique Designs
                  </span>
                  <div className="w-6 h-[1px] bg-[#381932]/20 mt-3 group-hover:w-12 transition-all duration-300" />
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 sm:p-8 shadow-xl border border-[#381932]/10 rounded-none flex flex-col justify-center items-center text-center group hover:border-[#381932] transition-colors duration-300">
                  <span className="block text-4xl sm:text-5xl font-serif font-black text-[#2D142C] tracking-tighter">
                    3M
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider font-sans font-bold text-[#381932]/60 mt-2">
                    Happy Clients
                  </span>
                  <div className="w-6 h-[1px] bg-[#381932]/20 mt-3 group-hover:w-12 transition-all duration-300" />
                </div>

              </div>

              {/* Know More CTA Button */}
              <div className="pt-2">
                <button
                  onClick={onEnterCollections}
                  className="px-8 py-4 bg-[#2D142C] text-white hover:bg-[#381932] text-[10px] uppercase tracking-[0.25em] font-sans font-bold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <span>Know More</span>
                  <span className="text-sm font-light">&rarr;</span>
                </button>
              </div>

            </div>

            {/* Right Column: Large Arched Portrait Frame holding high-end jewelry photo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[360px] aspect-[4/5] overflow-hidden rounded-t-full border-[3px] border-[#2D142C] shadow-2xl group">
                <div className="absolute inset-0 z-0">
                  <img 
                    src={homepageAssets?.slide_6 || slide6} 
                    alt="High Jewelry" 
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                <img
                  src={homepageAssets?.slide_6 || slide6}
                  alt="High Jewelry Arch Portrait"
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  referrerPolicy="no-referrer"
                />
                {/* Exquisite internal lighting border overlay */}
                <div className="absolute inset-0 border border-white/20 rounded-t-full pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D142C]/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ----------------- SECTION 6: COMPLIMENTARY 15 RETURN, GLOBAL JEWELER, CERTIFICATES ----------------- */}
      <section className="py-16 sm:py-20 bg-[#F4F1EA] border-b border-[#381932]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            
            {/* Badge 1: 15-Day Return */}
            <div className="group space-y-5 p-4 flex flex-col items-center justify-start text-center h-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                <img src={returnSvg} alt="15-Day Return" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.25em] font-bold text-[#381932] group-hover:text-[#D4AF37] transition-colors duration-500">
                15-Day Return
              </h3>
            </div>

            {/* Badge 2: Global Jeweler */}
            <div className="group space-y-5 p-4 flex flex-col items-center justify-start text-center h-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                <img src={globalSvg} alt="Global Boutique" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.25em] font-bold text-[#381932] group-hover:text-[#D4AF37] transition-colors duration-500">
                Global Presence
              </h3>
            </div>

            {/* Badge 3: Certificates */}
            <div className="group space-y-5 p-4 flex flex-col items-center justify-start text-center h-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                <img src={certifiedSvg} alt="Certified Documents" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.25em] font-bold text-[#381932] group-hover:text-[#D4AF37] transition-colors duration-500">
                Certified Jewelry
              </h3>
            </div>

            {/* Badge 4: Secure Checkout */}
            <div className="group space-y-5 p-4 flex flex-col items-center justify-start text-center h-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-1">
                <img src={secureCheckoutSvg} alt="Secure Checkout" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.25em] font-bold text-[#381932] group-hover:text-[#D4AF37] transition-colors duration-500">
                Secure Checkout
              </h3>
            </div>

          </div>

        </div>
      </section>

      {/* ----------------- SECTION 7: BLOGS AND FAQS ----------------- */}
      <section className="py-20 bg-[#F9F7F2] space-y-24">
        
        {/* Blogs Sub-Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Subheader */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#381932]/30 pb-6 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
                Atelier Chronicles
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#381932] tracking-tight">
                Luxury Diaries & Insights
              </h2>
            </div>
            <button
              onClick={onEnterAtelier}
              className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#381932] border-b border-[#381932] pb-1 hover:text-opacity-70 transition-all cursor-pointer self-start md:self-auto"
            >
              Read Full Journal
            </button>
          </div>

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allBlogs.map((blog) => (
              <div 
                key={blog.id} 
                className="group flex flex-col bg-white border border-[#381932]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Blog Image */}
                <div className="aspect-[16/10] bg-[#EAE8E3] overflow-hidden relative border-b border-[#381932]/10">
                  <img
                    src={blog.image?.url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#381932]/90 text-[#F9F7F2] text-[8px] uppercase tracking-widest font-sans font-bold px-2 py-1">
                    {blog.blog?.title || 'Journal'}
                  </div>
                </div>

                {/* Blog Info */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-[#381932]/50">
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h3 className="text-base font-serif font-bold text-[#381932] leading-snug group-hover:underline decoration-[#381932]/40">
                      {blog.title}
                    </h3>
                    <div 
                      className="text-xs text-[#381932]/70 leading-relaxed font-sans line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: blog.excerptHtml || blog.contentHtml }}
                    />
                  </div>

                  <button
                    onClick={onEnterAtelier}
                    className="flex items-center space-x-1.5 text-[9px] font-sans font-bold uppercase tracking-widest text-[#381932] pt-2 self-start cursor-pointer"
                  >
                    <span>Read Chronicle</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* FAQs Sub-Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
              Concierge Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#381932] tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="w-12 h-[1px] bg-[#381932] mx-auto mt-3" />
          </div>

          {/* Interactive Accordion List */}
          <div className="border-t border-b border-[#381932] divide-y divide-[#381932]/30">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center text-sm uppercase tracking-wider font-sans font-bold text-[#381932] text-left cursor-pointer focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <span className="text-[#381932]/60 ml-4 shrink-0 transition-transform duration-300">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  
                  {/* Expandable answer panel */}
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-[#381932]/80 leading-relaxed font-sans font-light pl-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA help card */}
          <div className="p-6 bg-[#EAE8E3]/40 border border-[#381932]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#381932]">
                Have another inquiry?
              </h4>
              <p className="text-[11px] text-[#381932]/70 font-sans mt-1">
                Consult with our server-side intelligent concierge or schedule a private chamber viewing.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEnterConcierge}
                className="px-4 py-2 bg-[#381932] text-white font-sans text-[9px] uppercase tracking-widest font-bold hover:bg-transparent hover:text-[#381932] border border-[#381932] transition-colors cursor-pointer"
              >
                AI Concierge
              </button>
              <button
                onClick={() => onNavigate('contact-us')}
                className="px-4 py-2 bg-transparent text-[#381932] font-sans text-[9px] uppercase tracking-widest font-bold hover:bg-[#381932] hover:text-white border border-[#381932] transition-colors cursor-pointer"
              >
                Contact Salon
              </button>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
