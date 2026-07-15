import React, { useState, useEffect } from 'react';
import { Product, CartItem } from './types';
import { useShopifyProducts } from './hooks/useShopifyProducts';
import AtelierHeader from './components/AtelierHeader';
import AtelierFooter from './components/AtelierFooter';
import HeroSection from './components/HeroSection';
import CollectionViewer from './components/CollectionViewer';
import ProductViewer from './components/ProductViewer';
import ContactUs from './components/ContactUs';
import Journal from './components/Journal';
import PolicyPage from './components/PolicyPage';
import Concierge from './components/Concierge';
import Cart from './components/Cart';
import AuthPage from './components/AuthPage';
import AccountDashboard from './components/AccountDashboard';
import { Heart, Eye, X, Compass } from 'lucide-react';
import { useShopifyCart } from './hooks/useShopifyCart';
import { lenis } from './lib/lenis'; // Initialize Lenis smooth scrolling globally

export type View = 'home' | 'all-product' | 'collection' | 'contact-us' | 'journal' | 'policy' | 'auth' | 'account';
export type PolicyType = 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy';

export default function App() {
  const { products: LUXURY_PRODUCTS } = useShopifyProducts();

  // Views & Product Selection
  const [currentView, setCurrentView] = useState<View>(() => {
    const path = window.location.pathname;
    if (path === '/collections/all') return 'all-product';
    if (path.startsWith('/collections/')) return 'collection';
    if (path === '/pages/contact') return 'contact-us';
    if (path === '/pages/journal') return 'journal';
    if (path.startsWith('/policies')) return 'policy';
    if (path === '/account/login' || path === '/account/register') return 'auth';
    if (path === '/account' || path === '/account/dashboard') return 'account';
    return 'home';
  });

  const [activeCollectionHandle, setActiveCollectionHandle] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/collections/')) return path.replace('/collections/', '');
    return null;
  });

  const [activePolicyType, setActivePolicyType] = useState<PolicyType | null>(() => {
    const path = window.location.pathname;
    if (path === '/policies/privacy-policy') return 'privacyPolicy';
    if (path === '/policies/shipping-policy') return 'shippingPolicy';
    if (path === '/policies/terms-of-service') return 'termsOfService';
    if (path === '/policies/refund-policy') return 'refundPolicy';
    return null;
  });
  const [lastViewBeforeDetail, setLastViewBeforeDetail] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [skipAnimation, setSkipAnimation] = useState(false);
  const selectedProductRef = React.useRef(selectedProduct);
  const savedScrollPosition = React.useRef<number>(0);
  useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  // Track if we need to load a product from the URL once data arrives
  const [pendingProductId, setPendingProductId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/products/')) return path.replace('/products/', '');
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'collections' && parts.length >= 3) return parts[2];
    return null;
  });

  // Resolve pending product once products load
  useEffect(() => {
    if (pendingProductId && LUXURY_PRODUCTS.length > 0) {
      const prod = LUXURY_PRODUCTS.find(p => p.id === pendingProductId);
      if (prod) {
        setSelectedProduct(prod);
        setPendingProductId(null);
      }
    }
  }, [LUXURY_PRODUCTS, pendingProductId]);

  // Keep selectedProduct fresh: when Shopify data replaces the static fallback,
  // update the selected product so ProductViewer gets real variants + images.
  useEffect(() => {
    if (selectedProduct) {
      const fresh = LUXURY_PRODUCTS.find(p => p.id === selectedProduct.id);
      if (fresh) setSelectedProduct(fresh);
    }
  }, [LUXURY_PRODUCTS]);



  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Prefilled states for Contact/Inquiry
  const [inquirySubject, setInquirySubject] = useState<string>('Private Chamber Viewing');
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);

  // ── Browser URL Routing (History API) ───────────────────────────────────────

  // 1. Sync State -> URL
  useEffect(() => {
    // If we haven't resolved the initial product URL yet, don't overwrite the URL!
    if (pendingProductId) return;

    let path = '/';
    if (selectedProduct) {
      if (currentView === 'collection' && activeCollectionHandle && activeCollectionHandle !== 'all') {
        path = `/collections/${activeCollectionHandle}/${selectedProduct.id}`;
      } else {
        path = `/products/${selectedProduct.id}`;
      }
    } else {
      switch (currentView) {
        case 'home': path = '/'; break;
        case 'all-product': path = '/collections/all'; break;
        case 'collection':
          if (activeCollectionHandle) path = `/collections/${activeCollectionHandle}`;
          else path = '/collections/all';
          break;
        case 'contact-us': path = '/pages/contact'; break;
        case 'journal': path = '/pages/journal'; break;
        case 'policy':
          if (activePolicyType === 'privacyPolicy') path = '/policies/privacy-policy';
          else if (activePolicyType === 'shippingPolicy') path = '/policies/shipping-policy';
          else if (activePolicyType === 'termsOfService') path = '/policies/terms-of-service';
          else if (activePolicyType === 'refundPolicy') path = '/policies/refund-policy';
          else path = '/policies';
          break;
        case 'auth': path = '/account/login'; break;
        case 'account': path = '/account/dashboard'; break;
      }
    }

    // Only push if the URL actually changed to avoid infinite loops
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
  }, [currentView, selectedProduct, activeCollectionHandle, activePolicyType]);

  // 2. Sync URL -> State (Initial Load & Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const parts = path.split('/').filter(Boolean);

      if (path.startsWith('/products/') || (parts[0] === 'collections' && parts.length >= 3)) {
        const id = path.startsWith('/products/') ? path.replace('/products/', '') : parts[2];
        if (parts[0] === 'collections' && parts.length >= 3) {
          setCurrentView('collection');
          setActiveCollectionHandle(parts[1]);
        }
        
        const prod = LUXURY_PRODUCTS.find(p => p.id === id);
        if (prod) {
          setSelectedProduct(prod);
        } else if (LUXURY_PRODUCTS.length === 0) {
          setPendingProductId(id);
        }
      } else {
        if (selectedProductRef.current) {
          setSkipAnimation(true);
          setTimeout(() => {
            window.scrollTo(0, savedScrollPosition.current);
            lenis.scrollTo(savedScrollPosition.current, { immediate: true });
          }, 0);
        } else {
          setSkipAnimation(false);
        }
        
        setSelectedProduct(null);
        if (path === '/') setCurrentView('home');
        else if (path === '/collections/all') setCurrentView('all-product');
        else if (path.startsWith('/collections/')) {
          setCurrentView('collection');
          setActiveCollectionHandle(path.replace('/collections/', ''));
        }
        else if (path === '/pages/contact') setCurrentView('contact-us');
        else if (path === '/pages/journal') setCurrentView('journal');
        else if (path.startsWith('/policies')) {
          setCurrentView('policy');
          if (path === '/policies/privacy-policy') setActivePolicyType('privacyPolicy');
          else if (path === '/policies/shipping-policy') setActivePolicyType('shippingPolicy');
          else if (path === '/policies/terms-of-service') setActivePolicyType('termsOfService');
          else if (path === '/policies/refund-policy') setActivePolicyType('refundPolicy');
          else setActivePolicyType(null);
        }
        else if (path === '/account/login' || path === '/account/register') setCurrentView('auth');
        else if (path === '/account' || path === '/account/dashboard') setCurrentView('account');

      }
    };

    // Run once on mount to handle direct links (e.g. user opens /collections/rings directly)
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [LUXURY_PRODUCTS]);

  // ── Shopify Cart Integration ────────────────────────────────────────────────
  // useShopifyCart transparently replaces the previous localStorage cart.
  // When Shopify is not configured, it falls back to the identical localStorage
  // behavior so the UI never breaks.
  const {
    cartItems,
    cartCount,
    checkoutUrl,
    addItem: shopifyAddToCart,
    removeItem: shopifyRemoveItem,
    updateQuantity: shopifyUpdateQuantity,
  } = useShopifyCart();

  // Wishlist — kept in localStorage (no Shopify equivalent without Metaobjects)
  // Isolated here so it can be swapped to Shopify Customer Metafields later.
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Sliding Drawer Controls
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const storedWish = localStorage.getItem('gehnok_wishlist');
      if (storedWish) setWishlist(JSON.parse(storedWish));
    } catch (err) {
      console.error('Failed to parse wishlist cache:', err);
    }
  }, []);


  // Global protection of luxury photography assets
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'IMG' ||
        target.closest('img') ||
        target.classList.contains('photo-protected') ||
        target.style.backgroundImage
      ) {
        e.preventDefault();
      }
    };
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('img')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Sync wishlist to localStorage
  const saveWishlist = (list: Product[]) => {
    setWishlist(list);
    localStorage.setItem('gehnok_wishlist', JSON.stringify(list));
  };

  // Cart operations — delegated to Shopify hook (with automatic localStorage fallback)
  const handleAddToCollection = (
    product: Product,
    quantity: number = 1,
    metalName?: string,
    priceFactor: number = 1.0,
    size?: string
  ) => {
    const finalMetal = metalName || product.metal;
    const finalSize = size || 'Standard';
    // Async fire-and-forget — hook handles both Shopify API and localStorage fallback
    shopifyAddToCart(product, quantity, finalMetal, priceFactor, finalSize);
  };

  const handleRemoveFromCollection = (productId: string, metal?: string, size?: string) => {
    shopifyRemoveItem(productId, metal, size);
  };

  const handleUpdateQuantity = (productId: string, quantity: number, metal?: string, size?: string) => {
    shopifyUpdateQuantity(productId, quantity, metal, size);
  };

  // Wishlist operations
  const handleToggleWishlist = (product: Product) => {
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      saveWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      saveWishlist([...wishlist, product]);
    }
  };

  // Main product inspection
  const handleExamineProduct = (product: Product) => {
    savedScrollPosition.current = window.scrollY;
    setLastViewBeforeDetail(currentView);
    setSelectedProduct(product);
  };

  // Quick action: Book a viewing
  const handleBookViewing = (product: Product) => {
    setInquirySubject('Private Chamber Viewing');
    setInquiryProduct(product);
    setCurrentView('contact-us');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear query on simple contact navigation
  const handleDirectContact = () => {
    setInquirySubject('General Salon Request');
    setInquiryProduct(null);
    setCurrentView('contact-us');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicy = (type: 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy') => {
    let path = '/policies';
    if (type === 'privacyPolicy') path = '/policies/privacy-policy';
    else if (type === 'shippingPolicy') path = '/policies/shipping-policy';
    else if (type === 'termsOfService') path = '/policies/terms-of-service';
    else if (type === 'refundPolicy') path = '/policies/refund-policy';
    window.history.pushState({}, '', path);
    setActivePolicyType(type);
    setCurrentView('policy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // cartCount comes from useShopifyCart hook

  const isAuthView = currentView === 'auth';

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#381932] relative selection:bg-[#381932]/10">

      {/* Exquisite Brand Header */}
      {!isAuthView && (
        <AtelierHeader
          onNavigate={(view, collectionHandle) => {
            setSkipAnimation(false);
            if (view === 'collection' && collectionHandle) {
              setActiveCollectionHandle(collectionHandle);
            }
            setCurrentView(view);
            setSelectedProduct(null); // Clear active item detail on navigation
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentView={currentView}
          activeCollectionHandle={activeCollectionHandle}
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1">

        {/* Render loading state if resolving a direct product URL */}
        {pendingProductId ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#381932]/20 border-t-[#381932] rounded-full animate-spin"></div>
              <p className="text-[10px] tracking-widest font-sans text-[#381932]/60 uppercase font-bold">Unveiling Masterpiece...</p>
            </div>
          </div>
        ) : selectedProduct ? (
          <ProductViewer
            product={selectedProduct}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onBack={() => {
              setSkipAnimation(true);
              setSelectedProduct(null);
              setCurrentView(lastViewBeforeDetail);
              setTimeout(() => {
                window.scrollTo(0, savedScrollPosition.current);
                lenis.scrollTo(savedScrollPosition.current, { immediate: true });
              }, 0);
            }}
            onAddToCollection={handleAddToCollection}
            onAddToWishlist={handleToggleWishlist}
            onBookPrivateViewing={handleBookViewing}
            isInWishlist={wishlist.some(item => item.id === selectedProduct.id)}
            onSelectProduct={handleExamineProduct}
          />
        ) : (
          <>
            {/* 1. HOME VIEW */}
            {currentView === 'home' && (
              <HeroSection
                onEnterCollections={() => setCurrentView('all-product')}
                onEnterConcierge={() => setIsConciergeOpen(true)}
                onEnterAtelier={() => {
                  setCurrentView('journal');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigate={(view, subFilter) => {
                  setSkipAnimation(false);
                  setCurrentView(view);
                  if (view === 'collection' && subFilter) {
                    setActiveCollectionHandle(subFilter);
                  }
                  setSelectedProduct(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProduct={handleExamineProduct}
              />
            )}

            {/* 2. ALL PRODUCTS VIEW */}
            {currentView === 'all-product' && (
              <CollectionViewer
                skipAnimation={skipAnimation}
                onSelectProduct={handleExamineProduct}
                title="Atelier Full Catalog"
                description="Explore our complete line of permanent vessels. Each masterwork is individually forged to heirloom specifications."
                searchQuery={searchQuery}
              />
            )}

            {/* 3. DYNAMIC COLLECTION VIEW */}
            {currentView === 'collection' && activeCollectionHandle && (
              <CollectionViewer
                skipAnimation={skipAnimation}
                key={activeCollectionHandle}
                collectionHandle={activeCollectionHandle}
                onSelectProduct={handleExamineProduct}
                searchQuery={searchQuery}
              />
            )}

            {/* 7. CONTACT US VIEW */}
            {currentView === 'contact-us' && (
              <ContactUs
                prefilledSubject={inquirySubject}
                prefilledProduct={inquiryProduct}
                products={LUXURY_PRODUCTS}
                onBackToProducts={() => setCurrentView('all-product')}
              />
            )}

            {/* 8. ATELIER JOURNAL VIEW */}
            {currentView === 'journal' && (
              <Journal
                onBackToAtelier={() => {
                  setCurrentView('all-product');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* 9. POLICY VIEW */}
            {currentView === 'policy' && (
              <PolicyPage
                policyType={activePolicyType}
                onBackToHome={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('home');
                }}
              />
            )}

            {/* 10. AUTH PAGE */}
            {currentView === 'auth' && (
              <AuthPage
                onBack={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('home');
                }}
                onSuccess={() => {
                  setCurrentView('account');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* 11. ACCOUNT DASHBOARD */}
            {currentView === 'account' && (
              <AccountDashboard
                onBack={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('home');
                }}
                onLogoutSuccess={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('home');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Elegant Brand Footer */}
      {!isAuthView && (
        <>
          <AtelierFooter
            onOpenPolicy={handleOpenPolicy}
            onNavigate={(view, collectionHandle) => {
              setSkipAnimation(false);
              if (view === 'collection' && collectionHandle) {
                setActiveCollectionHandle(collectionHandle);
              }
              setCurrentView(view);
              setSelectedProduct(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Slide-over Drawers */}

          {/* 1. Collection Cart Drawer */}
          <Cart
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCollection}
            onUpdateQuantity={handleUpdateQuantity}
            checkoutUrl={checkoutUrl}
          />

          {/* 2. Secure AI Concierge Chat Room Drawer */}
          <Concierge
            isOpen={isConciergeOpen}
            onClose={() => setIsConciergeOpen(false)}
            onExamineProduct={handleExamineProduct}
          />

          {/* 3. Wishlist Slide-over Panel (Bespoke layout) */}
          {isWishlistOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-500">
              <div className="absolute inset-0 cursor-pointer" onClick={() => setIsWishlistOpen(false)} />
              <div className="relative w-full max-w-md h-full bg-[#FFFFFF] text-[#381932] flex flex-col border-l border-[#381932] shadow-2xl p-6 font-sans">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#381932] pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="text-[#381932] fill-[#381932]" size={16} />
                    <h3 className="text-sm font-sans uppercase tracking-widest text-[#381932] font-bold">
                      Saved Creations
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="p-1.5 text-[#8A7F7A] hover:text-[#381932] transition-colors cursor-pointer"
                    title="Close Wishlist"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-20 text-xs text-[#381932]/60 italic leading-relaxed font-serif">
                      Your wishlist is empty. Examine our curated collections to save pieces for private viewing.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wishlist.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white border border-[#381932] p-4 rounded-none flex items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1">
                            <span className="text-[8px] font-sans text-[#381932]/60 uppercase tracking-widest block font-bold">
                              {product.collection}
                            </span>
                            <h4 className="text-xs font-serif font-bold text-[#381932]">
                              {product.name}
                            </h4>
                            <p className="text-[10px] font-mono text-[#381932] font-bold">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0
                              }).format(product.price)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                handleExamineProduct(product);
                                setIsWishlistOpen(false);
                              }}
                              className="p-2 bg-[#381932] text-white hover:bg-transparent hover:text-[#381932] border border-[#381932] rounded-none transition-all cursor-pointer"
                              title="Examine piece details"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleWishlist(product)}
                              className="p-2 border border-[#381932] text-[#381932] hover:bg-[#381932] hover:text-white rounded-none transition-all cursor-pointer"
                              title="Remove from saved list"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Floating Action Button for the Private Concierge */}
          <button
            onClick={() => setIsConciergeOpen(true)}
            className="fixed bottom-6 right-6 z-35 bg-[#381932] text-white hover:bg-[#FFFFFF] hover:text-[#381932] border border-[#381932] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
            title="Consult private concierge"
          >
            <Compass size={22} className="group-hover:rotate-45 transition-transform duration-700" />

            {/* Help tip pop */}
            <span className="absolute right-16 scale-0 group-hover:scale-100 transition-transform bg-[#381932] text-white border border-[#381932] text-[9px] font-sans uppercase tracking-widest px-3 py-1.5 rounded-none whitespace-nowrap shadow-lg font-bold">
              Consult Concierge
            </span>
          </button>
        </>
      )}

    </div>
  );
}
