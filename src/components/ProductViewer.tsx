import React, { lazy, Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Product, CartItem } from '../types';
import { lenis } from '../lib/lenis';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { useShopifyMetaobject } from '../hooks/useShopifyMetaobject';
import Gemstone3DViewer from './Gemstone3DViewer';
import HoverVideo from './HoverVideo';
import ImageWithSkeleton from './ImageWithSkeleton';
import { motion } from 'motion/react';
import { 
  Heart, Sparkles, Calendar, ArrowLeft, 
  ChevronDown, ChevronUp, Star, CheckCircle, Image, Scissors, PlayCircle,
  ChevronLeft, ChevronRight, Truck, Clock, X, Maximize2
} from 'lucide-react';
import paymentGatewayImg from '../assets/payment_gateway.svg';
import bisHallmarkImg from '../assets/BIS_Hallmark.svg';
import easyReturnImg from '../assets/Easy_Return_Exchange.svg';
import secureDeliveryImg from '../assets/Secure_Delivery.svg';
import skinFriendlyImg from '../assets/skin_friendly.svg';

const PreloadedVideo = ({ 
  src, 
  posterImg,
  isActive, 
  shouldPreload,
  onReady,
  className 
}: { 
  src: string; 
  posterImg?: string;
  isActive: boolean; 
  shouldPreload?: boolean;
  onReady?: () => void;
  className?: string; 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  useEffect(() => {
    if (isActive && videoRef.current) {
      if (isDownloaded) {
        videoRef.current.play().catch(() => {});
      }
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive, isDownloaded]);

  // Reset state if src changes
  useEffect(() => {
    setIsDownloaded(false);
  }, [src]);

  return (
    <>
      {/* Elegant static image placeholder that seamlessly crossfades into the video once downloaded */}
      {posterImg && (
        <img 
          src={posterImg}
          alt="Loading masterpiece..."
          className={`absolute inset-0 w-full h-full object-contain mix-blend-multiply z-20 transition-opacity duration-1000 ${isActive && !isDownloaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
      )}
      <video 
        ref={videoRef}
        src={src} 
        loop 
        muted 
        playsInline 
        autoPlay={isActive} 
        preload={isActive || shouldPreload ? "auto" : "none"} 
        onCanPlay={() => {
          if (!isDownloaded) {
            setIsDownloaded(true);
            if (isActive && onReady) {
              onReady();
            }
          }
        }}
        onPlaying={() => {
          if (!isDownloaded) {
            setIsDownloaded(true);
            if (isActive && onReady) {
              onReady();
            }
          }
        }}
        className={`${className} ${!posterImg && isActive && !isDownloaded ? 'opacity-0' : 'opacity-100'}`} 
      />
    </>
  );
};

const Model3DViewer = lazy(() => import('./Model3DViewer'));

interface ProductViewerProps {
  product: Product;
  cartItems?: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number, metal?: string, size?: string) => void;
  onBack: () => void;
  onAddToCollection: (product: Product, quantity: number, metalName: string, priceFactor: number, size: string) => void;
  onAddToWishlist: (product: Product) => void;
  onBookPrivateViewing: (product: Product) => void;
  isInWishlist: boolean;
  onSelectProduct?: (product: Product) => void;
}

// Ten exquisite metallurgy alloy choices as requested (matching user image perfectly)
const metalOptions = [
  { 
    id: '9k-gold', 
    label: '9K', 
    name: '9K Yellow Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFEAA5 0%, #D4AF37 20%, #FAF0C9 40%, #AA7C11 60%, #FFF8D6 80%, #6E5300 100%)', 
    textClass: 'text-[#4A3700] drop-shadow-sm', 
    priceFactor: 0.75 
  },
  { 
    id: '9k-rose', 
    label: '9K', 
    name: '9K Rose Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFD3BD 0%, #D18260 20%, #FFEBE0 40%, #A25232 60%, #FFF4ED 80%, #6C2B14 100%)', 
    textClass: 'text-[#4A1D09] drop-shadow-sm', 
    priceFactor: 0.75 
  },
  { 
    id: 'ss-silver', 
    label: 'SS', 
    name: 'Sterling Silver 925', 
    metallicStyle: 'linear-gradient(135deg, #FFFFFF 0%, #B8C1C4 20%, #F5F7F8 40%, #8A9396 60%, #E6EAEA 80%, #555B5D 100%)', 
    textClass: 'text-[#2D3031] drop-shadow-sm', 
    priceFactor: 0.50 
  },
  { 
    id: '14k-white', 
    label: '14K', 
    name: '14K White Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFFFFF 0%, #C4CBCD 20%, #F7FAFA 40%, #9AA3A6 60%, #EBF0F2 80%, #626A6C 100%)', 
    textClass: 'text-[#34393A] drop-shadow-sm', 
    priceFactor: 0.90 
  },
  { 
    id: '14k-rose', 
    label: '14K', 
    name: '14K Rose Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFE2D4 0%, #D38B6B 20%, #FFF2EB 40%, #A85A35 60%, #FFF6F0 80%, #6F3316 100%)', 
    textClass: 'text-[#4A200C] drop-shadow-sm', 
    priceFactor: 0.90 
  },
  { 
    id: '14k-gold', 
    label: '14K', 
    name: '14K Yellow Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFF6BD 0%, #D3B73C 20%, #FFFEEB 40%, #A78C1C 60%, #FFFFFA 80%, #6D5400 100%)', 
    textClass: 'text-[#4E3900] drop-shadow-sm', 
    priceFactor: 0.90 
  },
  { 
    id: '18k-white', 
    label: '18K', 
    name: '18K White Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFFFFF 0%, #CBD3D7 20%, #FAFAFC 40%, #9FA8AD 60%, #F1F4F6 80%, #687176 100%)', 
    textClass: 'text-[#373E43] drop-shadow-sm', 
    priceFactor: 1.00 
  },
  { 
    id: '18k-rose', 
    label: '18K', 
    name: '18K Rose Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFE8DE 0%, #D47953 20%, #FFF9F5 40%, #AA4F2A 60%, #FFFBF9 80%, #762D13 100%)', 
    textClass: 'text-[#4E1F0B] drop-shadow-sm', 
    priceFactor: 1.00 
  },
  { 
    id: '18k-gold', 
    label: '18K', 
    name: '18K Champagne Gold', 
    metallicStyle: 'linear-gradient(135deg, #FFF6D0 0%, #D1AF51 20%, #FFFFFA 40%, #9F8323 60%, #FFFFF0 80%, #6B5112 100%)', 
    textClass: 'text-[#503E05] drop-shadow-sm', 
    priceFactor: 1.00 
  },
  { 
    id: 'pt-platinum', 
    label: 'PT', 
    name: 'Platinum 950', 
    metallicStyle: 'linear-gradient(135deg, #FFFFFF 0%, #CDD5DA 20%, #F8FAFB 40%, #A0A9AE 60%, #F3F5F7 80%, #6D777D 100%)', 
    textClass: 'text-[#37474F] drop-shadow-sm', 
    priceFactor: 1.25 
  }
];

interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  isVerified: boolean;
}

// Static professional photographs matching the product categories as backup options
const getProductPhotos = (collection: string): string[] => {
  if (collection === 'Rings') {
    return [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?auto=format&fit=crop&w=800&q=80'
    ];
  }
  if (collection === 'Necklaces') {
    return [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80'
    ];
  }
  if (collection === 'Earrings') {
    return [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
    ];
  }
  return [
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1602752275313-477eaabc497c?auto=format&fit=crop&w=800&q=80'
  ];
};

const AccordionItem = ({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-[#381932]/20 last:border-b">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex justify-between items-center text-left focus:outline-none cursor-pointer group transition-colors hover:bg-[#FFFFFF]/50"
      >
        <span className="text-[12px] tracking-widest font-sans font-bold uppercase text-[#381932] group-hover:text-[#381932]/80 transition-colors">
          {title}
        </span>
        <div className="flex-shrink-0 text-[#381932] transition-transform duration-300">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-2 text-[14px] text-[#381932]/80 leading-relaxed font-sans space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ProductViewer({
  product,
  cartItems,
  onUpdateQuantity,
  onBack,
  onAddToCollection,
  onAddToWishlist,
  onBookPrivateViewing,
  isInWishlist,
  onSelectProduct
}: ProductViewerProps) {
  const { products: LUXURY_PRODUCTS, loading: productsLoading } = useShopifyProducts();
  const { data: metalAssets } = useShopifyMetaobject('metal_colors', 'main');
  const [activeAccordion, setActiveAccordion] = useState<string | null>('materials');
  const [isAdded, setIsAdded] = useState(false);
  const [isFullscreen3DOpen, setIsFullscreen3DOpen] = useState(false);

  // Custom configuration states
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Dynamic available metals from variants (100% data-driven from Shopify)
  const availableMetals = useMemo(() => {
    console.log('[DEBUG] product.options for', product.name, ':', product.options);
    if (product.options?.length) {
      const metalOption = product.options.find(opt => 
        opt.name.toLowerCase().includes('metal') || opt.name.toLowerCase().includes('material') || opt.name.toLowerCase().includes('color')
      );
      
      if (metalOption && metalOption.optionValues.length > 0) {
        return metalOption.optionValues.map(optionValue => {
          const metal = optionValue.name;
          const mLower = metal.toLowerCase();
          
          // Check if Shopify provided a native color swatch!
          const shopifyColor = optionValue.swatch?.color;

          // Advanced photorealistic flat metallic surface model
          const getMetallicStyle = (metalName: string, shopifySwatch?: string) => {
            const m = metalName.toLowerCase();
            
            // Define core colors: [Light Base, Dark Base, Highlight Shadow Tint]
            let lightBase, darkBase, shadowTint;

            if (m.includes('black rhodium')) {
              lightBase = '#595959'; darkBase = '#262626'; shadowTint = '10,10,10';
            } else if (m.includes('antique gold')) {
              lightBase = '#c9ad55'; darkBase = '#9c8232'; shadowTint = '60,40,10';
            } else if (m.includes('oxidized silver')) {
              lightBase = '#8c8c8c'; darkBase = '#595959'; shadowTint = '30,30,30';
            } else if (m.includes('champagne')) {
              lightBase = '#ebd5c1'; darkBase = '#d1b398'; shadowTint = '90,60,40';
            } else if (m.includes('rose')) {
              lightBase = '#e8a598'; darkBase = '#b76e5d'; shadowTint = '90,20,10';
            } else if (m.includes('white gold')) {
              lightBase = '#e6e5e3'; darkBase = '#c4c3c0'; shadowTint = '50,50,45';
            } else if (m.includes('yellow') || m.includes('gold')) {
              lightBase = '#e6c27a'; darkBase = '#d4af37'; shadowTint = '101,67,33';
            } else if (m.includes('platinum')) {
              lightBase = '#e8ecef'; darkBase = '#cbd0d4'; shadowTint = '30,35,40';
            } else {
              // Silver
              lightBase = '#e5e7eb'; darkBase = '#9ca3af'; shadowTint = '50,50,50';
            }

            if (shopifySwatch && shopifySwatch.startsWith('#')) {
              lightBase = shopifySwatch;
              darkBase = shopifySwatch; 
            }

            // Photorealistic Soft Satin/Brushed Finish
            // Reduces shine by ~85% to match brushed platinum, sterling silver, and satin 18K gold.
            // 1. A very soft, blurred highlight across the top edge
            // 2. A subtle diagonal tonal shift to mimic soft studio lighting
            // 3. A dominant base color gradient to keep the metal identity clear
            return `
              linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 25%, rgba(${shadowTint},0.05) 100%),
              linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 45%, rgba(${shadowTint},0.1) 100%),
              linear-gradient(135deg, ${lightBase} 0%, ${darkBase} 100%)
            `;
          };

          const getTextColor = (metalName: string, shopifySwatch?: string) => {
            const m = metalName.toLowerCase();
            if (m.includes('black rhodium') || m.includes('oxidized')) return 'text-[#f2f2f2] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]';
            if (m.includes('rose')) return 'text-[#3b1206] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]';
            if (m.includes('yellow') || m.includes('gold')) return 'text-[#332500] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]';
            return 'text-[#1a1a1a] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]';
          };

          let style = getMetallicStyle(metal, shopifyColor);
          let txt = getTextColor(metal, shopifyColor);
          let priceFactor = 1.0;
          let label = metal.substring(0, 2).toUpperCase();

          if (mLower.includes('platinum')) {
            label = 'PT';
            priceFactor = 1.25;
          } else if (mLower.includes('silver') || mLower === 'ss' || mLower.includes('sterling')) {
            label = 'SS';
          }

          if (mLower.includes('9k')) label = '9K';
          else if (mLower.includes('14k')) label = '14K';
          else if (mLower.includes('18k')) label = '18K';

          return {
            id: metal.toLowerCase().replace(/\s+/g, '-'),
            label,
            name: metal,
            metallicStyle: style,
            textClass: txt,
            priceFactor
          };
        });
      }
    }
    return []; // No static fallback
  }, [product]);

  // Dynamic available sizes from variants
  const availableSizes = useMemo(() => {
    if (product.options?.length) {
      const sizeOption = product.options.find(opt => 
        opt.name.toLowerCase().includes('size')
      );
      if (sizeOption && sizeOption.optionValues.length > 0) {
        return sizeOption.optionValues.map(v => v.name);
      }
    }
    return []; // No static fallback
  }, [product]);

  // Dynamically extract the exact variant option names from Shopify
  const metalOptionName = useMemo(() => {
    if (product.options?.length) {
      const metalOption = product.options.find(opt => 
        opt.name.toLowerCase().includes('metal') || opt.name.toLowerCase().includes('material') || opt.name.toLowerCase().includes('color')
      );
      if (metalOption) return metalOption.name;
    }
    return 'Metallurgy Alloy'; // Fallback
  }, [product]);

  const sizeOptionName = useMemo(() => {
    if (product.options?.length) {
      const sizeOption = product.options.find(opt => 
        opt.name.toLowerCase().includes('size')
      );
      if (sizeOption) return sizeOption.name;
    }
    return 'Configuration Size'; // Fallback
  }, [product]);

  // Extract video from descriptionHtml if present
  const { cleanedDescriptionHtml, extractedVideoUrl } = useMemo(() => {
    let html = product.descriptionHtml || '';
    let videoUrl = null;

    if (html) {
      // Find video src using a simple regex
      const videoMatch = html.match(/<video[^>]*>.*?<source[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is) || 
                         html.match(/<video[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is);
      
      if (videoMatch && videoMatch[1]) {
        videoUrl = videoMatch[1];
      }

      // Always strip video tags from the description to prevent double-rendering or broken fallbacks
      html = html.replace(/<video[\s\S]*?<\/video>/gi, '');
      // Strip any standalone fallback text like "Your browser does not support..."
      html = html.replace(/Your browser does not support[\s\S]*?(video|audio)[\s\S]*?(\.|<\/p>|<br>|$)/gi, '');
    }
    
    return { cleanedDescriptionHtml: html, extractedVideoUrl: videoUrl };
  }, [product.descriptionHtml]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedMetal, setSelectedMetal] = useState<any>(null);

  // Dynamic available purities (e.g. 9K, 14K, 18K)
  const availablePurities = useMemo(() => {
    if (!product.options?.length) return [];
    const purityOpt = product.options.find(opt => 
      opt.name.toLowerCase().includes('purity') || opt.name.toLowerCase().includes('karat') || opt.name.toLowerCase() === 'material'
    );
    if (purityOpt && purityOpt.optionValues.length > 0) {
      return purityOpt.optionValues.map(v => v.name);
    }
    return [];
  }, [product.options]);

  const otherOptions = useMemo(() => {
    if (!product.options?.length) return [];
    return product.options.filter(opt => {
      const name = opt.name.toLowerCase();
      const isMetal = name.includes('metal') || name.includes('material') || name.includes('color');
      const isSize = name.includes('size');
      const isPurity = name.includes('purity') || name.includes('karat') || name === 'material';
      return !isMetal && !isSize && !isPurity && name !== 'title'; // 'title' is default no-op
    });
  }, [product.options]);

  const [selectedPurity, setSelectedPurity] = useState<string>('');
  const [otherSelections, setOtherSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedMetal && availableMetals.length > 0) setSelectedMetal(availableMetals[0]);
    if (!selectedPurity && availablePurities.length > 0) setSelectedPurity(availablePurities[0]);
    if (otherOptions.length > 0) {
      setOtherSelections(prev => {
        const newSel = { ...prev };
        let changed = false;
        otherOptions.forEach(opt => {
          if (!newSel[opt.name] && opt.optionValues.length > 0) {
            newSel[opt.name] = opt.optionValues[0].name;
            changed = true;
          }
        });
        return changed ? newSel : prev;
      });
    }
  }, [availableMetals, availablePurities, otherOptions]);

  // Tab selector state for Media
  const [activeMediaTab, setActiveMediaTab] = useState<'3d' | 'photos'>('photos');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);

  const handleVideoSelect = useCallback((videoUrl: string, index: number) => {
    setActivePhotoIndex(index); // Video thumbnails act just like images
  }, []);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreenGalleryOpen || isFullscreen3DOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreenGalleryOpen, isFullscreen3DOpen]);

  // Interactive reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFormName, setReviewFormName] = useState('');
  const [reviewFormRating, setReviewFormRating] = useState(5);
  const [reviewFormContent, setReviewFormContent] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  // Copied coupon indicator state
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const couponScrollRef = useRef<HTMLDivElement>(null);

  const scrollCoupons = (direction: 'left' | 'right') => {
    const container = couponScrollRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === 'left' ? -container.clientWidth * 0.85 : container.clientWidth * 0.85,
      behavior: 'smooth'
    });
  };
  
  // Track when active video is ready so we can progressively load the others
  const [videosReadyToPreload, setVideosReadyToPreload] = useState(false);

  // Set initial selections based on product properties
  useEffect(() => {
    setSelectedSize(availableSizes[1] || availableSizes[0] || 'Standard');

    const initialMetalMatch = availableMetals.find(m => 
      m.name.toLowerCase().includes(product.metal.toLowerCase())
    ) || availableMetals[0] || null;
    setSelectedMetal(initialMetalMatch);

    setReviews(product.reviews || []);
    setSelectedQuantity(1);
    setActivePhotoIndex(0);
    setActiveMediaTab('photos'); // Default to beautiful photo galleries first

    // Reset scroll when product changes
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });
  }, [product, availableSizes, availableMetals]);

  const getGemstoneColorProfile = (product: Product) => {
    const name = product.name.toLowerCase();
    if (name.includes('amethyst')) return 'amethyst';
    if (name.includes('emerald')) return 'green';
    if (name.includes('tourmaline') || name.includes('siren')) return 'blue';
    if (name.includes('diamond') || name.includes('solitaire')) return 'diamond';
    return 'gold';
  };

  const handleAddClick = () => {
    onAddToCollection(
      product, 
      selectedQuantity, 
      selectedMetal?.name, 
      selectedMetal?.priceFactor, 
      selectedSize
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewFormName.trim() || !reviewFormContent.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      name: reviewFormName,
      title: 'Signature Review',
      rating: reviewFormRating,
      content: reviewFormContent,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      isVerified: true
    };

    setReviews([newReview, ...reviews]);
    setReviewFormName('');
    setReviewFormRating(5);
    setReviewFormContent('');
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 3000);
  };

  // Group images by variant: Shopify natively groups variant images by their order in the media list.
  // A variant's image marks the beginning of its group, which continues until the next variant's image.

  const selectedVariant = product.variants?.find(v => {
    const isMetalMatch = selectedMetal ? v.selectedOptions.some(opt => 
      (opt.name.toLowerCase().includes('metal') || opt.name.toLowerCase().includes('material') || opt.name.toLowerCase().includes('color')) &&
      selectedMetal.name.toLowerCase().includes(opt.value.toLowerCase())
    ) : true;
    
    const isPurityMatch = selectedPurity ? v.selectedOptions.some(opt => 
      (opt.name.toLowerCase().includes('purity') || opt.name.toLowerCase().includes('karat') || opt.name.toLowerCase() === 'material') &&
      opt.value.toLowerCase() === selectedPurity.toLowerCase()
    ) : true;

    const isSizeMatch = selectedSize ? v.selectedOptions.some(opt => 
      (opt.name.toLowerCase().includes('size')) &&
      opt.value.toLowerCase() === selectedSize.toLowerCase()
    ) : true;

    const isOtherMatch = Object.entries(otherSelections).every(([optName, optValue]) => {
      return v.selectedOptions.some(vOpt => 
        vOpt.name === optName && vOpt.value === optValue
      );
    });

    // For products with NO options, it will match the default variant
    return isMetalMatch && isPurityMatch && isSizeMatch && isOtherMatch;
  });

  // Use the real Shopify variant price if available, fallback to product base price
  const variantPriceAmount = selectedVariant 
    ? selectedVariant.price 
    : product.price;
  
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(variantPriceAmount);

  // Compute filtered photo list and specific video for the selected metal
  const { productPhotos, currentMetalVideo, currentModel3d } = useMemo(() => {
    const allImages =
      product.images && product.images.length > 0
        ? product.images
        : getProductPhotos(product.collection);

    if (!selectedMetal || !product.media || product.media.length === 0 || !allImages.length) {
      return { productPhotos: allImages, currentMetalVideo: null };
    }

    // Group images by delimiters (Video and 3D Model mark the end of a metal's gallery)
    const groups: { images: string[], video: string | null, model3d: string | null }[] = [];
    let currentImages: string[] = [];
    let currentVideo: string | null = null;
    let currentModel: string | null = null;
    let imageIndex = 0;

    const allModels: string[] = [];

    for (const m of product.media) {
      const typeStr = (m.mediaContentType || (m as any).type || '').toUpperCase();
      const formatStr = (m.format || '').toLowerCase();
      const urlStr = (m.url || m.embeddedUrl || '').toLowerCase();
      const hasGlbSource = m.sources?.some(s => s.format?.toLowerCase() === 'glb' || s.url?.toLowerCase().includes('.glb'));

      const isModel = typeStr === 'MODEL_3D' || typeStr === '3D' || formatStr === 'glb' || urlStr.includes('.glb') || hasGlbSource;
      const isVideo = typeStr === 'VIDEO' || typeStr === 'EXTERNAL_VIDEO' || urlStr.includes('.mp4') || !!m.embeddedUrl;

      if (isModel) {
        const preferredSource = m.sources?.find(s => s.format?.toLowerCase() === 'glb' || s.url?.toLowerCase().includes('.glb')) || m.sources?.[0];
        currentModel = preferredSource?.url || m.url || null;
        if (currentModel) allModels.push(currentModel);
      } else if (isVideo) {
        currentVideo = m.url || m.embeddedUrl || null;
      } else {
        // Treat as Image
        if (currentVideo !== null || currentModel !== null) {
          groups.push({ images: [...currentImages], video: currentVideo, model3d: currentModel });
          currentImages = [];
          currentVideo = null;
          currentModel = null;
        }
        if (imageIndex < allImages.length) {
          currentImages.push(allImages[imageIndex]);
          imageIndex++;
        }
      }
    }
    
    if (currentImages.length > 0 || currentVideo !== null || currentModel !== null) {
      groups.push({ images: currentImages, video: currentVideo, model3d: currentModel });
    }

    let safeIndex = 0;
    
    // Strategy 1: Match by Shopify Variant Image (100% accurate if available)
    let matchedByVariant = false;
    if (selectedVariant?.image) {
      const variantImgUrl = typeof selectedVariant.image === 'string' 
        ? selectedVariant.image.toLowerCase() 
        : (selectedVariant.image as any).url?.toLowerCase();
        
      if (variantImgUrl) {
        const matchIdx = groups.findIndex(g => g.images.some(img => img.toLowerCase().includes(variantImgUrl) || variantImgUrl.includes(img.toLowerCase())));
        if (matchIdx !== -1) {
          safeIndex = matchIdx;
          matchedByVariant = true;
        }
      }
    }

    // Strategy 2: Match by filename keywords (Highly accurate for jewelry)
    if (!matchedByVariant) {
      const mName = selectedMetal?.name.toLowerCase() || '';
      const keyword = mName.includes('rose') ? 'rose' :
                      mName.includes('white') ? 'white' :
                      mName.includes('silver') ? 'silver' :
                      mName.includes('platinum') ? 'platinum' : 'yellow';

      let maxScore = 0;
      let bestIndex = -1;

      groups.forEach((g, idx) => {
        let score = 0;
        const str = JSON.stringify(g).toLowerCase();
        if (str.includes(keyword)) score += 10;
        if (keyword === 'white' && (str.includes('-wg') || str.includes('_wg'))) score += 5;
        if (keyword === 'yellow' && (str.includes('-yg') || str.includes('_yg'))) score += 5;
        if (keyword === 'rose' && (str.includes('-rg') || str.includes('_rg'))) score += 5;
        
        if (score > maxScore) {
          maxScore = score;
          bestIndex = idx;
        }
      });

      if (maxScore > 0 && bestIndex !== -1) {
        safeIndex = bestIndex;
      } else {
        // Strategy 3: Fallback to the exact physical upload order identified from your Shopify store
        // Group 0 = Gold / Yellow
        // Group 1 = Rose Gold
        // Group 2 = White / Silver
        const mName = selectedMetal?.name.toLowerCase() || '';
        if (mName.includes('yellow') || (mName.includes('gold') && !mName.includes('rose') && !mName.includes('white'))) {
          safeIndex = 0;
        } else if (mName.includes('rose')) {
          safeIndex = 1;
        } else if (mName.includes('white') || mName.includes('silver') || mName.includes('platinum')) {
          safeIndex = 2;
        }
        
        // Ensure we don't go out of bounds if they uploaded fewer groups
        if (safeIndex >= groups.length) {
          safeIndex = groups.length - 1;
        }
      }
    }

    const selectedGroup = groups[safeIndex] || { images: allImages, video: null, model3d: null };
    const strictlyMappedModel = allModels.length > 0 ? allModels[safeIndex] : null;
    
    return {
      productPhotos: selectedGroup.images.length > 0 ? selectedGroup.images : allImages,
      currentMetalVideo: selectedGroup.video,
      currentModel3d: selectedGroup.model3d || strictlyMappedModel || null,
      debugInfo: {
        safeIndex,
        allModelsLength: allModels.length,
        groupsLength: groups.length,
        hasStrictModel: !!strictlyMappedModel,
        hasGroupModel: !!selectedGroup.model3d
      }
    };
  }, [selectedMetal, product.media, product.images, product.collection, availableMetals]);

  const activeGalleryVideo =
    currentMetalVideo ||
    extractedVideoUrl ||
    (product.media?.find(m => m.mediaContentType === 'VIDEO' || m.mediaContentType === 'EXTERNAL_VIDEO')?.url ?? null);

  const galleryItems = useMemo(() => {
    const items: Array<{ type: 'video' | 'image'; url: string }> = [];

    if (activeGalleryVideo) {
      items.push({ type: 'video', url: activeGalleryVideo });
    }

    productPhotos.forEach(photo => {
      items.push({ type: 'image', url: photo });
    });

    return items;
  }, [activeGalleryVideo, productPhotos]);

  const model3DUrl = useMemo(() => {
    // Return the strictly mapped color-specific 3D model. 
    // We removed the aggressive fallback so it won't force the Rose Gold model onto every color if models are missing!
    return currentModel3d || null;
  }, [currentModel3d]);

  // Clamp activePhotoIndex to valid range after productPhotos/video changes
  const safePhotoIndex = galleryItems.length > 0 ? Math.min(activePhotoIndex, galleryItems.length - 1) : 0;
  const activeGalleryItem = galleryItems[safePhotoIndex];

  const showPreviousGalleryItem = useCallback(() => {
    if (galleryItems.length <= 1) return;
    setActivePhotoIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  const showNextGalleryItem = useCallback(() => {
    if (galleryItems.length <= 1) return;
    setActivePhotoIndex(prev => (prev + 1) % galleryItems.length);
  }, [galleryItems.length]);

  // Keyboard navigation for fullscreen gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen3DOpen) {
        if (e.key === 'Escape') setIsFullscreen3DOpen(false);
        return;
      }
      if (!isFullscreenGalleryOpen) return;
      if (e.key === 'Escape') setIsFullscreenGalleryOpen(false);
      if (e.key === 'ArrowRight') showNextGalleryItem();
      if (e.key === 'ArrowLeft') showPreviousGalleryItem();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenGalleryOpen, isFullscreen3DOpen, showNextGalleryItem, showPreviousGalleryItem]);

  // Removed the artificial CSS tinting because it tinted the entire photograph (including skin and backgrounds)
  const getMetalFilterStyle = (metalId: string): React.CSSProperties => {
    return { transition: 'all 0.5s ease-in-out' };
  };

  // Average Rating Calculator
  // Average Rating Calculator
  const averageRating = product.rating 
    ? product.rating.toFixed(1)
    : reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const totalReviewsCount = product.ratingCount || reviews.length;

  const displayRelatedProducts = useMemo(() => {
    let related = LUXURY_PRODUCTS.filter(p => p.id !== product.id && p.collection === product.collection);
    if (related.length === 0) {
      related = LUXURY_PRODUCTS.filter(p => p.id !== product.id);
    }
    const shuffled = [...related].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, [product.id, product.collection, LUXURY_PRODUCTS]);

  const relatedGridClass = 
    displayRelatedProducts.length === 1 ? "grid grid-cols-1 max-w-sm mx-auto" :
    displayRelatedProducts.length === 2 ? "grid grid-cols-2 max-w-3xl mx-auto gap-6 md:gap-10" :
    displayRelatedProducts.length === 3 ? "grid grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto gap-6 md:gap-10" :
    "grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10";

  return (
    <>
    <div className="py-12 bg-[#FFFFFF]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932] hover:line-through mb-10 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Collections</span>
        </button>

        {/* Two Column Luxury View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Media Tabs (Interactive 3D / Photographs) & Story */}
          <div className="lg:col-span-6 space-y-8 lg:sticky lg:top-24 lg:self-start">
            {/* Media Tab System Selector */}
            <div className="flex pb-1 space-x-6">
              <button
                onClick={() => setActiveMediaTab('photos')}
                className={`pb-3 text-[10px] uppercase tracking-widest font-sans font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  activeMediaTab === 'photos'
                    ? 'border-[#381932] text-[#381932]'
                    : 'border-transparent text-[#381932]/50 hover:text-[#381932]'
                }`}
              >
                <Image size={12} />
                <span>Atelier Photographs</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('3d')}
                className={`pb-3 text-[10px] uppercase tracking-widest font-sans font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  activeMediaTab === '3d'
                    ? 'border-[#381932] text-[#381932]'
                    : 'border-transparent text-[#381932]/50 hover:text-[#381932]'
                }`}
              >
                <Sparkles size={12} />
                <span>3D CAD Studio</span>
              </button>
            </div>

            {/* Media Window Render */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-fade-in relative">
              {activeMediaTab === '3d' ? (
                <div className="space-y-2 relative">
                  <button
                    onClick={() => setIsFullscreen3DOpen(true)}
                    className="absolute top-2 right-2 z-[20] p-2 bg-[#381932]/10 hover:bg-[#381932]/20 text-[#381932] rounded-full transition-colors cursor-pointer"
                    title="View Fullscreen"
                  >
                    <Maximize2 size={16} />
                  </button>
                  {model3DUrl ? (
                    <Suspense
                      fallback={
                        <div className="h-[400px] w-full border border-[#381932]/10 bg-[#FFFFFF] rounded-md flex items-center justify-center text-[9px] font-mono uppercase tracking-[0.18em] text-[#381932]/60">
                          Preparing 3D studio
                        </div>
                      }
                    >
                      <Model3DViewer src={model3DUrl} poster={productPhotos[0]} title={product.name} />
                    </Suspense>
                  ) : (
                    <Gemstone3DViewer
                      color={getGemstoneColorProfile(product)}
                      cut={product.gemstone?.cut || 'Round Brilliant'}
                    />
                  )}
                  <p className="text-[9px] text-[#381932]/60 font-mono text-center uppercase tracking-wider">
                    Drag to rotate and inspect the model
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active main media frame */}
                  <div className="w-full h-[400px] bg-transparent relative overflow-hidden flex items-center justify-center group">
                    {activeGalleryItem?.type === 'video' ? (
                      activeGalleryItem.url.includes('youtube') || activeGalleryItem.url.includes('vimeo') ? (
                        <iframe
                          src={activeGalleryItem.url}
                          className="absolute inset-0 w-full h-full mix-blend-multiply"
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay; fullscreen"
                        />
                      ) : (
                        <PreloadedVideo
                          src={activeGalleryItem.url}
                          posterImg={productPhotos[0]}
                          isActive
                          shouldPreload={videosReadyToPreload}
                          onReady={() => setVideosReadyToPreload(true)}
                          className="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-105"
                        />
                      )
                    ) : activeGalleryItem?.type === 'image' ? (
                      <ImageWithSkeleton
                        src={activeGalleryItem.url}
                        alt={`${product.name} Studio Photography`}
                        style={getMetalFilterStyle(selectedMetal?.id || '')}
                        className="object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-105"
                        containerClassName="absolute inset-0 z-0"
                        referrerPolicy="no-referrer"
                        draggable={false}
                        loading="eager" // Main image should load instantly
                        fetchPriority="high"
                      />
                    ) : null}
                    
                    {/* Protective transparent overlay to block right-click and save, but allow opening full screen */}
                    <div 
                      className="absolute inset-0 z-[15] cursor-pointer" 
                      onContextMenu={(e) => e.preventDefault()} 
                      onClick={() => setIsFullscreenGalleryOpen(true)}
                    />

                    {galleryItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousGalleryItem}
                          className="hidden md:flex absolute left-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#381932]/70 bg-[#FFFFFF]/85 text-[#381932] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#381932] hover:text-white cursor-pointer"
                          aria-label="Previous product media"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={showNextGalleryItem}
                          className="hidden md:flex absolute right-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#381932]/70 bg-[#FFFFFF]/85 text-[#381932] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#381932] hover:text-white cursor-pointer"
                          aria-label="Next product media"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
                  <div 
                    className="flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scroll"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {galleryItems.map((item, index) => {
                      if (index === safePhotoIndex) return null;
                      return (
                        <button
                          key={`${item.type}-${item.url}-${index}`}
                          onClick={() => setActivePhotoIndex(index)}
                          className="flex-shrink-0 w-[calc(33.333%-10.66px)] aspect-square bg-transparent overflow-hidden relative cursor-pointer group transition-all duration-300 opacity-50 hover:opacity-100 snap-center"
                        >
                          {item.type === 'video' ? (
                            <>
                              {productPhotos[0] && (
                                <ImageWithSkeleton
                                  src={productPhotos[0]}
                                  alt={`${product.name} Video`}
                                  style={getMetalFilterStyle(selectedMetal?.id || '')}
                                  className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.02]"
                                  containerClassName="absolute inset-0 z-0"
                                  referrerPolicy="no-referrer"
                                  draggable={false}
                                  loading="lazy"
                                  decoding="async"
                                />
                              )}
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FFFFFF]/45">
                                <PlayCircle size={28} className="text-[#381932]" />
                              </div>
                            </>
                          ) : (
                            <ImageWithSkeleton
                              src={item.url}
                              alt={`${product.name} Angle ${index + 1}`}
                              style={getMetalFilterStyle(selectedMetal?.id || '')}
                              className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.02]"
                              containerClassName="absolute inset-0 z-0"
                              referrerPolicy="no-referrer"
                              draggable={false}
                              loading="lazy" // Thumbnails must be lazy loaded so they don't block the network
                              decoding="async"
                            />
                          )}

                          {/* Protective overlay for thumbnail */}
                          <div className="absolute inset-0 z-15" onContextMenu={(e) => e.preventDefault()} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* In-depth story card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="hidden lg:block bg-[#FFFFFF] border border-[#381932] p-8 rounded-none space-y-4">
              <span className="text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932] opacity-60">
                Provenance & Story
              </span>
              <h3 className="text-xl font-serif-luxury text-[#381932] font-bold italic">
                "{product.name}"
              </h3>
              <p className="text-sm text-[#381932]/80 leading-relaxed italic">
                {product.story}
              </p>
              <div className="pt-4 border-t border-[#381932] grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[8px] tracking-[0.15em] font-sans font-bold text-[#381932]/60 uppercase">
                    Handcrafted For
                  </span>
                  <span className="text-xs text-[#381932] font-bold font-mono">
                    {product.craftsmanship.artisanHours} Atelier Hours
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.15em] font-sans font-bold text-[#381932]/60 uppercase">
                    Metallurgy Composition
                  </span>
                  <span className="text-xs text-[#381932] font-bold">
                    {product.purity} {product.metal}
                  </span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Configuration Options, Title, Core Actions */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-[10px] tracking-widest font-sans font-bold uppercase text-[#381932]/60 block mb-2">
                {product.collection} • Private Viewing
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif-luxury tracking-wide text-[#381932] font-bold mb-3">
                {product.name}
              </h1>
              <div className="flex items-center space-x-3 mb-2">
                <p className="text-xl font-mono text-[#381932] font-bold">
                  {formattedPrice}
                </p>
                {selectedMetal?.priceFactor !== 1 && selectedMetal?.priceFactor !== undefined && (
                  <span className="text-[9px] tracking-wider uppercase font-mono bg-[#FFFFFF] text-[#381932] px-2 py-0.5 font-bold">
                    Alloy Rate Adjusted
                  </span>
                )}
              </div>
              
              {/* Star review summary badge */}
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} className="fill-current" />
                  ))}
                </div>
                <span className="text-[10px] font-sans text-[#381932] font-bold">
                  {averageRating} ({totalReviewsCount} Signature Reviews)
                </span>
              </div>
            </div>

            {/* Custom Interactive Configuration Form Panel */}
            <div className="border-t border-[#381932] pt-6 space-y-6">
              
              {/* 1. Metal Alloy Selector as requested (matching user image circle buttons) */}
              {availableMetals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/60">
                      Select {metalOptionName}:
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#381932] bg-[#FFFFFF] px-2 py-0.5">
                      {selectedMetal?.name}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 py-1">
                    {availableMetals.map(metal => {
                      const isActive = selectedMetal?.id === metal.id;
                      
                      const mLower = metal.name.toLowerCase();
                      let metaImageUrl = null;
                      
                      const isRose = mLower.includes('rose');
                      const isWhite = mLower.includes('white') || mLower.includes('platinum');
                      const isYellow = mLower.includes('yellow') || (!isRose && !isWhite && mLower.includes('gold'));
                      
                      const has18k = mLower.includes('18k');
                      const has14k = mLower.includes('14k');
                      const has9k = mLower.includes('9k');
                      const hasSilver = mLower.includes('silver') || mLower.includes('ss') || mLower.includes('si');

                      if (metalAssets) {
                        for (const key of Object.keys(metalAssets)) {
                          if (!metalAssets[key]) continue;
                          
                          const formattedKey = key.toLowerCase().replace(/_/g, ' ');
                          const keyIsRose = formattedKey.includes('rose');
                          const keyIsWhite = formattedKey.includes('white') || formattedKey.includes('platinum');
                          const keyIsYellow = formattedKey.includes('yellow') || (!keyIsRose && !keyIsWhite && formattedKey.includes('gold'));
                          
                          const keyHas18k = formattedKey.includes('18k');
                          const keyHas14k = formattedKey.includes('14k');
                          const keyHas9k = formattedKey.includes('9k');
                          const keyHasSilver = formattedKey.includes('silver') || formattedKey.includes('ss') || formattedKey.includes('si');
                          
                          if (isRose === keyIsRose && isWhite === keyIsWhite && isYellow === keyIsYellow &&
                              has18k === keyHas18k && has14k === keyHas14k && has9k === keyHas9k && hasSilver === keyHasSilver) {
                            metaImageUrl = metalAssets[key];
                            break;
                          }
                        }
                      }

                      return (
                        <button
                          key={metal.id}
                          type="button"
                          onClick={() => setSelectedMetal(metal)}
                          className="group relative flex flex-col items-center cursor-pointer focus:outline-none"
                          title={metal.name}
                        >
                          {/* Outer Container for the textured coin */}
                          <div 
                            className={`flex items-center justify-center rounded-full transition-all duration-250 ease-out shadow-sm
                              ${isActive 
                                ? 'w-12 h-12 border-[3px] border-[#381932] shadow-[0_0_8px_rgba(56,25,50,0.4)] scale-100 z-10' 
                                : 'w-11 h-11 border border-neutral-300 hover:scale-108 hover:border-neutral-400 hover:shadow-md hover:brightness-105'
                              }`}
                          >
                            {/* Inner flat metallic disc */}
                            <div 
                              style={{ background: metaImageUrl ? 'none' : metal.metallicStyle }}
                              className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center bg-white"
                            >
                              {metaImageUrl && (
                                <img src={metaImageUrl} alt={metal.name} className="absolute inset-0 w-full h-full object-cover" />
                              )}
                              
                              {/* Subtle brushed metal texture */}
                              <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none bg-[repeating-linear-gradient(45deg,_transparent,_transparent_1px,_rgba(0,0,0,0.1)_1px,_rgba(0,0,0,0.1)_2px)]"></div>

                              {/* Very soft flat inner bevel to indicate a machined disc edge */}
                              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),_inset_0_1px_2px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                              
                              {/* Engraved text */}
                              <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-sans font-bold tracking-tighter opacity-90 ${metal.textClass} pointer-events-none select-none z-10`}>
                                {metal.label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1.5. Purity Selector */}
              {availablePurities.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/60">
                      Select Purity:
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#381932] bg-[#FFFFFF] px-2 py-0.5">
                      {selectedPurity}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {availablePurities.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedPurity(p)}
                        className={`px-6 py-2.5 border ${selectedPurity === p ? 'border-[#381932] bg-[#381932] text-white' : 'border-[#FFFFFF] bg-[#FFFFFF] text-[#381932] hover:border-[#381932]/50'} font-mono text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm cursor-pointer`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Sizing selector as requested */}
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/60">
                      Select {sizeOptionName}:
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#381932] bg-[#FFFFFF] px-2 py-0.5">
                      {selectedSize}
                    </span>
                  </div>
                  <div className="relative w-full mt-2">
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full appearance-none bg-transparent border border-[#381932]/30 text-[#381932] px-4 py-3 font-mono text-xs font-bold focus:outline-none focus:border-[#381932] transition-colors cursor-pointer rounded-none"
                    >
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#381932]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Option Selectors (e.g. Length, Chain Style, Shape) */}
              {otherOptions.map(option => (
                <div key={option.name} className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/60">
                      Select {option.name}:
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#381932] bg-[#FFFFFF] px-2 py-0.5">
                      {otherSelections[option.name]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.optionValues.map(val => {
                      const isActive = otherSelections[option.name] === val.name;
                      return (
                        <button
                          key={val.name}
                          type="button"
                          onClick={() => setOtherSelections(prev => ({ ...prev, [option.name]: val.name }))}
                          className={`px-4 py-2 text-[10px] font-mono tracking-wider transition-all duration-300 border cursor-pointer ${
                            isActive
                              ? 'bg-[#381932] text-white border-[#381932] font-bold'
                              : 'bg-transparent text-[#381932] border-[#381932]/30 hover:border-[#381932]'
                          }`}
                        >
                          {val.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* 3. Quantity Adjuster (Only if in collection) */}
              {(() => {
                const currentCartItem = cartItems?.find(item => 
                  item.product.id === product.id && 
                  (item.selectedMetal === (selectedMetal?.name || product.metal) || (!item.selectedMetal)) && 
                  (item.selectedSize === (selectedSize || 'Standard') || (!item.selectedSize))
                );

                if (currentCartItem && onUpdateQuantity) {
                  return (
                    <div className="space-y-3">
                      <span className="block text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/80 bg-[#381932]/10 px-3 py-1.5 inline-block rounded-none border border-[#381932]/20">
                        {currentCartItem.quantity} ITEM(S) ALREADY IN COLLECTION
                      </span>
                      <div className="flex items-center space-x-3 mt-2">
                        <div className="flex items-center border border-[#381932] bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, Math.max(0, currentCartItem.quantity - 1), selectedMetal?.name || product.metal, selectedSize || 'Standard')}
                            className="px-3 py-2 text-xs font-mono font-bold hover:bg-[#381932] hover:text-white transition-colors border-r border-[#381932] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-5 text-xs font-mono font-bold text-[#381932]">
                            {currentCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(product.id, currentCartItem.quantity + 1, selectedMetal?.name || product.metal, selectedSize || 'Standard')}
                            className="px-3 py-2 text-xs font-mono font-bold hover:bg-[#381932] hover:text-white transition-colors border-l border-[#381932] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-[#381932]/60 uppercase">
                          Adjust Collection Quantity
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* In-depth story card (Mobile Only, moved below Qty) */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="block lg:hidden bg-[#FFFFFF] border border-[#381932] p-6 sm:p-8 rounded-none space-y-4 mt-6">
                <span className="text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932] opacity-60">
                  Provenance & Story
                </span>
                <h3 className="text-xl font-serif-luxury text-[#381932] font-bold italic">
                  "{product.name}"
                </h3>
                <p className="text-sm text-[#381932]/80 leading-relaxed italic">
                  {product.story}
                </p>
                <div className="pt-4 border-t border-[#381932] grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] tracking-[0.15em] font-sans font-bold text-[#381932]/60 uppercase">
                      Handcrafted For
                    </span>
                    <span className="text-xs text-[#381932] font-bold font-mono">
                      {product.craftsmanship.artisanHours} Atelier Hours
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] tracking-[0.15em] font-sans font-bold text-[#381932]/60 uppercase">
                      Metallurgy Composition
                    </span>
                    <span className="text-xs text-[#381932] font-bold">
                      {product.purity} {product.metal}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Luxury Coupon Section (Exact Image Replica) */}
              <div className="space-y-4 pt-5 border-t border-[#381932]/10">
                <div className="flex items-center justify-between gap-4">
                  <span className="block text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932]/60">
                    Available Privileges & Coupons:
                  </span>
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollCoupons('left')}
                      className="h-8 w-8 border border-[#381932]/70 rounded-full flex items-center justify-center text-[#381932] hover:bg-[#381932] hover:text-white transition-colors cursor-pointer"
                      aria-label="Previous coupon"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCoupons('right')}
                      className="h-8 w-8 border border-[#381932]/70 rounded-full flex items-center justify-center text-[#381932] hover:bg-[#381932] hover:text-white transition-colors cursor-pointer"
                      aria-label="Next coupon"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div
                  ref={couponScrollRef}
                  className="flex space-x-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {[
                    { code: 'FIRST10', label: 'On Your First Order', rate: '10%', sub: 'OFF' },
                    { code: 'GEHKNOKVIP', label: 'VIP Loyalty Benefit', rate: '15%', sub: 'OFF' },
                    { code: 'SOVEREIGN5', label: 'Elite Masterwork Privilege', rate: '5%', sub: 'OFF' }
                  ].map((coupon) => (
                    <div key={coupon.code} className="relative flex-shrink-0 w-[300px] sm:w-[320px] snap-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                      <div 
                        className="flex items-stretch min-h-[105px] w-full h-full bg-gradient-to-r from-[#FDF8F0] to-white rounded-xl"
                        style={{
                          boxShadow: '0 10px 24px rgba(56, 25, 50, 0.08)',
                          WebkitMaskImage: 'radial-gradient(circle at 0 50%, transparent 12px, black 12.5px), radial-gradient(circle at 100% 50%, transparent 12px, black 12.5px)',
                          WebkitMaskSize: '51% 100%',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'left, right',
                          maskImage: 'radial-gradient(circle at 0 50%, transparent 12px, black 12.5px), radial-gradient(circle at 100% 50%, transparent 12px, black 12.5px)',
                          maskSize: '51% 100%',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'left, right'
                        }}
                      >
                        {/* Left side: Ticket Details */}
                      <div className="flex-1 flex flex-col justify-center items-center px-4 py-3 space-y-1.5 text-center">
                        <span className="text-[12px] sm:text-[14px] font-sans font-bold text-[#2B1624] tracking-tight mb-1">
                          {coupon.label}
                        </span>
                        <div className="w-full max-w-[155px] py-1 border-[1.5px] border-[#2B1624] rounded-md bg-transparent text-[11px] font-sans font-medium text-[#2B1624] tracking-wide text-center uppercase select-all">
                          {coupon.code}
                        </div>
                        <button
                           type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            setCopiedCoupon(coupon.code);
                            setTimeout(() => setCopiedCoupon(null), 2500);
                          }}
                          className="w-full max-w-[155px] py-1.5 bg-[#2B1624] text-white hover:bg-[#381932] text-[10px] font-sans font-bold uppercase transition-all duration-300 rounded-md cursor-pointer active:scale-95"
                        >
                          {copiedCoupon === coupon.code ? 'COPIED!' : 'COPY CODE'}
                        </button>
                      </div>

                      {/* Middle: Pattern & Dashed Divider */}
                      <div className="w-[36px] relative flex items-stretch border-r-2 border-dashed border-[#2B1624]">
                        {/* Golden Star Pattern */}
                        <div 
                          className="w-full h-full opacity-80"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M9 0 C9 5.5 5.5 9 0 9 C5.5 9 9 12.5 9 18 C9 12.5 12.5 9 18 9 C12.5 9 9 5.5 9 0 Z' fill='%23C99E27' /%3E%3C/svg%3E")`,
                            backgroundSize: '18px 18px',
                            backgroundRepeat: 'repeat',
                            backgroundPosition: 'left top'
                          }}
                        />
                        {/* Scissors Icon */}
                        <div className="absolute -bottom-[2px] -right-[9px] text-[#2B1624] transform -rotate-45 z-10 pointer-events-none bg-[#FDF8F0]">
                          <Scissors size={14} className="scale-x-[-1]" />
                        </div>
                      </div>

                      {/* Right side: Discount Rate */}
                      <div className="w-[85px] flex flex-col items-center justify-center text-center pr-3 pl-1 select-none">
                        <span className="text-[34px] font-sans font-bold text-[#2B1624] leading-none tracking-tighter">
                          {coupon.rate}
                        </span>
                        <span className="text-[20px] font-serif text-[#2B1624] leading-none mt-1">
                          OFF
                        </span>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Core Action Zone */}
            <div className="space-y-4 pt-6 border-t border-[#381932]">
              
              {/* Primary CTA: Add to Collection (Never Buy Now) */}
              <button
                onClick={handleAddClick}
                className={`w-full py-4 text-xs uppercase tracking-widest font-sans font-bold border rounded-none transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isAdded
                    ? 'bg-[#381932] text-[#FFFFFF] border-[#381932]'
                    : 'bg-[#381932] text-white border-[#381932] hover:bg-transparent hover:text-[#381932]'
                }`}
              >
                {isAdded ? 'Added to Collection' : 'Add to Collection'}
              </button>

              {/* Secondary Boutique Actions */}
              <div className="block mt-4">
                <button
                  onClick={() => onAddToWishlist(product)}
                  className={`w-full py-3.5 text-[10px] uppercase tracking-widest font-sans font-bold border rounded-none flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                    isInWishlist
                      ? 'border-[#381932] text-[#381932] bg-[#381932]/10'
                      : 'border-[#381932] text-[#381932] hover:bg-[#381932] hover:text-white'
                  }`}
                >
                  <Heart size={12} className={isInWishlist ? 'fill-[#381932]' : ''} />
                  <span>{isInWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-4 p-4 border border-[#381932]/10 rounded-md bg-[#FFFFFF]/70">
                <div className="flex flex-col items-center justify-center space-y-3 opacity-80 hover:opacity-100 transition-all mix-blend-multiply group cursor-default">
                  <img src={bisHallmarkImg} alt="BIS Hallmark" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                  <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#381932]/70 text-center leading-[1.2]">BIS Hallmark</span>
                </div>
                <div className="flex flex-col items-center justify-center space-y-3 opacity-80 hover:opacity-100 transition-all mix-blend-multiply group cursor-default">
                  <img src={easyReturnImg} alt="Easy Return & Exchange" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                  <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#381932]/70 text-center leading-[1.2]">Easy Return Exchange</span>
                </div>
                <div className="flex flex-col items-center justify-center space-y-3 opacity-80 hover:opacity-100 transition-all mix-blend-multiply group cursor-default">
                  <img src={secureDeliveryImg} alt="Secure Delivery" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                  <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#381932]/70 text-center leading-[1.2]">Secure Delivery</span>
                </div>
                <div className="flex flex-col items-center justify-center space-y-3 opacity-80 hover:opacity-100 transition-all mix-blend-multiply group cursor-default">
                  <img src={skinFriendlyImg} alt="Skin Friendly" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                  <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#381932]/70 text-center leading-[1.2]">Skin Friendly</span>
                </div>
              </div>

              <div className="mt-4 p-4 border border-[#381932]/10 rounded-md bg-[#FFFFFF]/70 flex items-center justify-center">
                <img
                  src={paymentGatewayImg}
                  alt="Secure payment options"
                  className="w-full max-w-[420px] h-auto object-contain mix-blend-multiply opacity-90"
                />
              </div>
            </div>

            {/* Gemstone Details Accordion (Moved back to right column) */}
            {product.gemstone && (
              <div className="border-t border-b border-[#381932] divide-y divide-[#381932]">
                <div className="py-4">
                  <button
                    onClick={() => toggleAccordion('materials')}
                    className="w-full flex justify-between items-center text-xs uppercase tracking-widest font-sans font-bold text-[#381932] py-2 text-left cursor-pointer"
                  >
                    <span>Gemstone & Materials</span>
                    {activeAccordion === 'materials' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {activeAccordion === 'materials' && (
                    <div className="mt-4 space-y-3 pl-1 text-xs text-[#381932]/80 leading-relaxed">
                      <div className="grid grid-cols-2 gap-y-2 border border-[#381932] p-4 rounded-none bg-[#FFFFFF]/40">
                        <div>
                          <span className="block text-[8px] font-sans font-bold text-[#381932]/60 uppercase">Gemstone Type</span>
                          <span className="text-[#381932] font-bold">{product.gemstone.type}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-sans font-bold text-[#381932]/60 uppercase">Cut Style</span>
                          <span className="text-[#381932] font-bold">{product.gemstone.cut}</span>
                        </div>
                        <div className="pt-2 border-t border-[#381932]">
                          <span className="block text-[8px] font-sans font-bold text-[#381932]/60 uppercase">Carat Weight</span>
                          <span className="text-[#381932] font-bold font-mono">{product.gemstone.carat} ct</span>
                        </div>
                        <div className="pt-2 border-t border-[#381932]">
                          <span className="block text-[8px] font-sans font-bold text-[#381932]/60 uppercase">Clarity & Color</span>
                          <span className="text-[#381932] font-bold font-mono">{product.gemstone.clarity} / {product.gemstone.color}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Shipping & Returns extracted from here */}
          </div>
        </div>

        {/* ----------------- END OF POLICIES ----------------- */}

        {/* Fullscreen Media Gallery */}
        {isFullscreenGalleryOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-[#FFFFFF]/95 backdrop-blur-xl flex items-center justify-center">
            {/* Close / Back Button */}
            <button
              onClick={() => setIsFullscreenGalleryOpen(false)}
              className="absolute top-6 left-6 z-[110] flex items-center space-x-2 text-[#381932]/70 hover:text-[#381932] transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} />
              <span className="font-sans text-[12px] uppercase tracking-widest font-bold">Back to Product</span>
            </button>
            <button
              onClick={() => setIsFullscreenGalleryOpen(false)}
              className="absolute top-6 right-6 z-[110] p-2 text-[#381932]/70 hover:text-[#381932] transition-colors cursor-pointer bg-[#381932]/5 rounded-full hover:bg-[#381932]/10"
            >
              <X size={24} />
            </button>

            {/* Main Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
              {activeGalleryItem?.type === 'video' ? (
                <div className="w-full max-w-6xl h-full flex items-center justify-center relative">
                  {activeGalleryItem.url.includes('youtube') || activeGalleryItem.url.includes('vimeo') ? (
                    <iframe
                      src={activeGalleryItem.url}
                      className="w-full aspect-video max-h-full mix-blend-multiply"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                    />
                  ) : (
                    <video
                      src={activeGalleryItem.url}
                      poster={productPhotos[0]}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full max-h-full object-contain mix-blend-multiply"
                    />
                  )}
                  {/* Protective overlay for custom videos in full screen */}
                  {!activeGalleryItem.url.includes('youtube') && !activeGalleryItem.url.includes('vimeo') && (
                    <div className="absolute inset-0 z-10 pointer-events-none" onContextMenu={(e) => e.preventDefault()} />
                  )}
                </div>
              ) : activeGalleryItem?.type === 'image' ? (
                <div className="w-full h-full flex items-center justify-center relative">
                  <img
                    src={activeGalleryItem.url}
                    alt={`${product.name} Fullscreen`}
                    className="max-w-full max-h-full object-contain select-none pointer-events-none mix-blend-multiply"
                    style={getMetalFilterStyle(selectedMetal?.id || '')}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                  {/* Protective overlay */}
                  <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                </div>
              ) : null}
            </div>

            {/* Navigation Buttons */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); showPreviousGalleryItem(); }}
                  className="absolute left-4 sm:left-12 top-1/2 z-[110] -translate-y-1/2 p-3 rounded-full bg-[#381932]/5 text-[#381932] hover:bg-[#381932]/10 transition-colors cursor-pointer backdrop-blur-md border border-[#381932]/10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); showNextGalleryItem(); }}
                  className="absolute right-4 sm:right-12 top-1/2 z-[110] -translate-y-1/2 p-3 rounded-full bg-[#381932]/5 text-[#381932] hover:bg-[#381932]/10 transition-colors cursor-pointer backdrop-blur-md border border-[#381932]/10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            
            {/* Image Pagination Dots */}
            {galleryItems.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-3">
                {galleryItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === safePhotoIndex ? 'bg-[#381932] scale-125' : 'bg-[#381932]/30 hover:bg-[#381932]/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>,
          document.body
        )}

        {/* Fullscreen 3D Viewer */}
        {isFullscreen3DOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-[#FFFFFF]/95 backdrop-blur-xl flex items-center justify-center">
            {/* Close / Back Button */}
            <button
              onClick={() => setIsFullscreen3DOpen(false)}
              className="absolute top-6 left-6 z-[110] flex items-center space-x-2 text-[#381932]/70 hover:text-[#381932] transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} />
              <span className="font-sans text-[12px] uppercase tracking-widest font-bold">Back to Product</span>
            </button>
            <button
              onClick={() => setIsFullscreen3DOpen(false)}
              className="absolute top-6 right-6 z-[110] p-2 text-[#381932]/70 hover:text-[#381932] transition-colors cursor-pointer bg-[#381932]/5 rounded-full hover:bg-[#381932]/10"
            >
              <X size={24} />
            </button>

            {/* Main Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
              <div className="w-full max-w-6xl h-full flex items-center justify-center relative">
                {model3DUrl ? (
                  <Suspense
                    fallback={
                      <div className="h-[400px] w-full border border-[#381932]/10 bg-transparent rounded-md flex items-center justify-center text-[9px] font-mono uppercase tracking-[0.18em] text-[#381932]/60">
                        Preparing 3D studio
                      </div>
                    }
                  >
                    <Model3DViewer src={model3DUrl} poster={productPhotos[0]} title={product.name} isFullscreen={true} />
                  </Suspense>
                ) : (
                  <Gemstone3DViewer
                    color={getGemstoneColorProfile(product)}
                    cut={product.gemstone?.cut || 'Round Brilliant'}
                    isFullscreen={true}
                  />
                )}
              </div>
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#381932]/60 font-mono text-[10px] tracking-[0.2em] uppercase">
              Drag to rotate and inspect
            </div>
          </div>,
          document.body
        )}
        
        {/* ----------------- SECTOR: POLICIES SIDE-BY-SIDE ----------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16 pt-12 border-t border-[#381932]/20">
          <div>
            <AccordionItem title="Shipping Details" defaultOpen={true}>
              <div className="flex items-center space-x-2 font-serif text-[16px] text-gray-900 mb-2">
                <Clock size={18} strokeWidth={1.5} />
                <span>Processing Time</span>
              </div>
              
              <ul className="space-y-1.5 list-none pl-1 mb-4 text-[14px]">
                <li>• Ready-to-ship pieces: <strong className="font-semibold">1-2</strong> business days</li>
                <li>• Made-to-order pieces: <strong className="font-semibold">7-14</strong> business days</li>
                <li>• Custom / engraved items: <strong className="font-semibold">10-18</strong> business days</li>
              </ul>
              
              <p className="mb-4">Orders placed on weekends or public holidays are processed the next business day.</p>
              
              <hr className="border-gray-200 my-4" />
              
              <div className="flex items-center space-x-2 font-serif text-[16px] text-gray-900 mb-2 mt-4">
                <Truck size={18} strokeWidth={1.5} />
                <span>Delivery Timeframe</span>
              </div>
              
              <ul className="space-y-1.5 list-none pl-1 mb-4 text-[14px]">
                <li>• Metro cities: <strong className="font-semibold">2-4</strong> business days</li>
                <li>• Rest of India: <strong className="font-semibold">4-7</strong> business days</li>
                <li>• International: <strong className="font-semibold">10-18</strong> business days</li>
                <li>• Express delivery: <strong className="font-semibold">1-2</strong> business days (depend on pin codes)</li>
              </ul>
              
              <hr className="border-gray-200 my-4" />
              
              <p>We ship via trusted courier partners including Blue Dart, Delhivery, FedEx and DTDC. A tracking link is shared via SMS and email once your order is dispatched.</p>
              
              <hr className="border-gray-200 my-4" />
              
              <p>International orders may be subject to customs duties and taxes per the destination country's laws. These charges are the buyer's responsibility.</p>
              
              <hr className="border-gray-200 my-4" />
              
              <p className="mt-4">
                <span className="font-bold text-[#381932]">Know more about </span>
                <a href="/policies/shipping-policy" className="text-[#381932] underline underline-offset-4 decoration-[#381932]/40 hover:decoration-[#381932] transition-colors">shipping Policy</a>
              </p>
            </AccordionItem>
          </div>
          
          <div>
            <AccordionItem title="Return & Exchange" defaultOpen={true}>
              <p>We accept returns within <strong className="font-semibold">15 days</strong> from the date of delivery.</p>
              
              <hr className="border-gray-200 my-4" />
              
              <p>Items showing signs of wear, damage caused by the customer, or missing certificates will not be accepted for return.</p>
              
              <hr className="border-gray-200 my-4" />
              
              <h5 className="font-serif text-[16px] text-gray-900 mb-2 mt-4">To be eligible, items must be</h5>
              <ul className="space-y-1.5 list-none pl-1 mb-4 text-[14px]">
                <li>• Unworn, unaltered, and in original condition</li>
                <li>• In the original packaging with all tags intact</li>
                <li>• Accompanied by the original invoice and, for diamond jewelry, the original certificate (GIA, IGI, SGL, or equivalent)</li>
                <li>• Free from any signs of wear, resizing, or tampering</li>
              </ul>
              
              <hr className="border-gray-200 my-4" />
              
              <h5 className="font-serif text-[16px] text-gray-900 mb-2 mt-4">Non-Returnable Items</h5>
              <p className="mb-2">The following items cannot be returned under any circumstances:</p>
              <ul className="space-y-1.5 list-disc pl-5 mb-4 text-[14px]">
                <li>Engraved / personalized pieces</li>
                <li>Custom-made jewelry</li>
                <li>Nose pins & body jewelry</li>
                <li>Final sale items</li>
                <li>Gift cards</li>
              </ul>
              
              <hr className="border-gray-200 my-4" />
              
              <p className="mt-4">
                <span className="font-bold text-[#381932]">Know more about </span>
                <a href="/policies/refund-policy" className="text-[#381932] underline underline-offset-4 decoration-[#381932]/40 hover:decoration-[#381932] transition-colors">Return Policy</a>
              </p>
            </AccordionItem>
          </div>
        </div>

        {/* ----------------- SECTOR: SIGNATURE CLIENT REVIEWS ----------------- */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-8 border-t border-[#381932] pt-8 pb-8"
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Form: Add Signature Review */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border border-[#381932] bg-[#FFFFFF] p-6 sm:p-8 rounded-none">
                <span className="text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932]/60 block mb-2">
                  Leave a Statement
                </span>
                <h4 className="text-xl font-serif-luxury text-[#381932] font-bold mb-4">
                  Log a Signature Review
                </h4>

                {reviewSuccessMsg ? (
                  <div className="p-4 bg-[#FFFFFF] border border-[#381932] text-xs text-[#381932] flex items-center space-x-2 font-bold uppercase font-sans tracking-wide">
                    <CheckCircle size={14} />
                    <span>Appraisal successfully committed to our registers.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932]">
                          Collector Name
                        </label>
                        <input
                          type="text"
                          value={reviewFormName}
                          onChange={(e) => setReviewFormName(e.target.value)}
                          required
                          placeholder="e.g. Charlotte M."
                          className="w-full bg-[#FFFFFF] text-[#381932] border border-[#381932] rounded-none px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#381932] outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932]">
                          Commit Star Rating
                        </label>
                        <div className="flex min-h-[35px] items-center space-x-2 bg-[#FFFFFF] px-3.5 py-2 border border-[#381932]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewFormRating(s)}
                              className="text-[#381932] hover:scale-110 transition-transform focus:outline-none"
                              aria-label={`Set rating to ${s} star${s === 1 ? '' : 's'}`}
                            >
                              <Star
                                size={16}
                                className={s <= reviewFormRating ? 'fill-amber-500 text-amber-500' : 'text-[#381932]/30'}
                              />
                            </button>
                          ))}
                          <span className="text-[10px] font-mono font-bold text-[#381932] pl-2 uppercase">
                            {reviewFormRating} Stars
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932]">
                        Your Appraisal Content
                      </label>
                      <textarea
                        value={reviewFormContent}
                        onChange={(e) => setReviewFormContent(e.target.value)}
                        required
                        rows={4}
                        placeholder="Share your raw assessment of the gemstone, metallurgy, or boutique courier experience..."
                        className="w-full bg-[#FFFFFF] text-[#381932] border border-[#381932] rounded-none p-3.5 text-xs focus:ring-1 focus:ring-[#381932] outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 text-[10px] uppercase tracking-widest font-sans font-bold bg-[#381932] text-white border border-[#381932] hover:bg-transparent hover:text-[#381932] transition-all rounded-none cursor-pointer"
                    >
                      Commit Review
                    </button>
                  </form>
                )}
              </motion.div>

            {/* List of Verified Appraisals */}
            <div className="space-y-6 border border-[#381932] bg-[#FFFFFF] p-6 sm:p-8">
              <h4 className="text-[10px] tracking-widest font-sans font-bold uppercase text-[#381932] border-b border-[#381932]/30 pb-2">
                Logged Registers ({totalReviewsCount})
              </h4>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-xs italic text-[#381932]/60">
                  No verified appraisals exist yet. Use the form beside this register to leave a signature review.
                </div>
              ) : (
                <div className="divide-y divide-[#381932]/30 space-y-6 max-h-[400px] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2">
                  {reviews.map((review) => (
                    <div key={review.id} className="pt-6 first:pt-0 space-y-2 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-2">
                          {/* 5-Star Rating rendered precisely with Star component */}
                          <div className="flex text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={i < review.rating ? 'fill-current' : 'text-[#381932]/20'} 
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-[#381932] font-mono">
                            {review.rating}.0
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-[#381932]/50">
                          <span>{review.date}</span>
                          {review.isVerified && (
                            <span className="flex items-center space-x-1 text-[9px] font-sans font-bold uppercase text-[#381932] bg-[#FFFFFF] px-2 py-0.5 font-bold">
                              <CheckCircle size={8} />
                              <span>Verified Owner</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <h5 className="text-sm font-bold font-serif text-[#381932]">
                        "{review.title}"
                      </h5>
                      <p className="text-xs text-[#381932]/80 leading-relaxed">
                        {review.content}
                      </p>
                      <p className="text-[10px] font-mono text-[#381932]/60">
                        — Registered Collector: <span className="font-bold">{review.name}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>

        {/* OTHER PRODUCTS SECTION ("You May Also Like") */}
        <section className="py-20 bg-white w-full overflow-hidden">
          <div className="w-full px-4 sm:px-8 lg:px-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-2 mb-12"
            >
              <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-[#381932]/60 block">
                ATELIER RECOMMENDATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#381932] tracking-tight">
                Explore {product.collection === 'Bespoke' ? 'Other Masterpieces' : `More ${product.collection}`}
              </h2>
              <div className="w-12 h-[1px] bg-[#381932] mx-auto mt-3" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={relatedGridClass}
            >
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`rel-skel-${idx}`} className="group flex flex-col justify-between cursor-pointer animate-pulse">
                    <div className="aspect-[4/5] bg-[#FFFFFF]/50 border border-[#381932]/10 flex items-center justify-center mb-6" />
                    <div className="space-y-2 text-center px-4">
                      <div className="h-2 w-1/3 bg-[#FFFFFF] mx-auto" />
                      <div className="h-4 w-3/4 bg-[#FFFFFF] mx-auto" />
                      <div className="h-3 w-1/4 bg-[#FFFFFF] mx-auto" />
                    </div>
                  </div>
                ))
              ) : (
                displayRelatedProducts.map((item) => (
                  <div 
                    key={item.id}
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onMouseEnter={(e) => {
                    const video = e.currentTarget.querySelector('video');
                    if (video) video.play().catch(() => {});
                  }}
                  onMouseLeave={(e) => {
                    const video = e.currentTarget.querySelector('video');
                    if (video) {
                      video.pause();
                      video.currentTime = 0;
                    }
                  }}
                  className="group flex flex-col justify-between cursor-pointer animate-fade-in"
                >
                  <div className="aspect-[4/5] bg-[#F5F5F5] relative overflow-hidden flex items-center justify-center mb-6">
                    {(() => {
                      const videoMedia = item.media?.find(m => m.mediaContentType === 'VIDEO' || m.mediaContentType === 'EXTERNAL_VIDEO');
                      let videoUrl = videoMedia?.url;
                      if (!videoUrl && item.descriptionHtml) {
                        const match = item.descriptionHtml.match(/<video[^>]*>.*?<source[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is) || item.descriptionHtml.match(/<video[^>]*src="([^"]+)"[^>]*>.*?<\/video>/is);
                        if (match && match[1]) {
                          videoUrl = match[1];
                        }
                      }
                      
                      return (
                        <>
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className={`object-contain w-3/4 h-3/4 transition-all duration-300 ease-out mix-blend-multiply relative z-10 ${videoUrl ? 'group-hover:opacity-0' : ''}`}
                            referrerPolicy="no-referrer"
                          />
                          {videoUrl && (
                            <video 
                              src={videoUrl} 
                              loop 
                              muted 
                              playsInline 
                              preload="metadata"
                              className="absolute inset-0 m-auto w-4/5 h-4/5 object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 mix-blend-multiply pointer-events-none" 
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="pt-4 space-y-1 text-left bg-transparent">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-[#381932] leading-snug group-hover:text-[#381932]/80 transition-colors duration-300">
                      {item.name.split('-')[0].trim()}
                    </h3>
                    <div className="pt-0.5">
                      <span className="text-sm font-sans font-medium text-[#381932]">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              )))}
            </motion.div>
          </div>
        </section>

    </>
  );
}
