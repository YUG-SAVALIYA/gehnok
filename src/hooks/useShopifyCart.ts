/**
 * GEHNOK Shopify Headless Integration
 * useShopifyCart — React hook for full Shopify Cart API integration.
 *
 * Replaces the existing localStorage cart in App.tsx.
 * The cart ID is persisted in localStorage; the cart data itself lives in Shopify.
 *
 * All Cart.tsx UI props remain fully compatible — this hook returns
 * values in the exact shape those props expect.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, Product } from '../types';
import { NormalizedCart, NormalizedCartLine } from '../shopify/types';
import { normalizedLineToLegacyCartItem } from '../shopify/mappers';

// ─── Raw Shopify cart normalizer ──────────────────────────────────────────────
// The server returns Shopify's raw GraphQL shape:
//   cart.lines = { edges: [{ node: CartLine }] }
// The hook expects a flat NormalizedCart with lines as a plain array.
// This function bridges the two shapes safely.

function toINR(amount: string, currencyCode: string): number {
  const n = parseFloat(amount);
  if (isNaN(n)) return 0;
  if (currencyCode === 'INR') return Math.round(n);
  if (currencyCode === 'USD') return Math.round(n * 84);
  return Math.round(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRawCart(raw: any): NormalizedCart {
  const lineEdges: any[] = raw?.lines?.edges ?? [];

  const lines: NormalizedCartLine[] = lineEdges.map((edge: any) => {
    const node = edge.node ?? edge; // handle both edges[].node and flat arrays
    const merch = node.merchandise ?? {};
    const product = merch.product ?? {};
    const price = merch.price ?? {};
    const cmpPrice = merch.compareAtPrice ?? null;

    const selectedOptions: Array<{ name: string; value: string }> = merch.selectedOptions ?? [];
    const metalOption = selectedOptions.find(
      (o) => o.name?.toLowerCase().includes('metal') || o.name?.toLowerCase().includes('material')
    )?.value;
    const sizeOption = selectedOptions.find(
      (o) => o.name?.toLowerCase().includes('size')
    )?.value;

    return {
      lineId: node.id ?? '',
      variantId: merch.id ?? '',
      productId: product.id ?? '',
      productHandle: product.handle ?? '',
      title: product.title ?? merch.title ?? '',
      variantTitle: merch.title ?? '',
      quantity: node.quantity ?? 1,
      price: toINR(price.amount ?? '0', price.currencyCode ?? 'INR'),
      compareAtPrice: cmpPrice
        ? toINR(cmpPrice.amount ?? '0', cmpPrice.currencyCode ?? 'INR')
        : undefined,
      image: merch.image?.url ?? undefined,
      selectedOptions,
      selectedMetal: metalOption ?? 'Champagne Gold',
      selectedSize: sizeOption ?? 'Standard',
    };
  });

  const totalAmount = raw?.cost?.totalAmount ?? {};
  const subtotalAmount = raw?.cost?.subtotalAmount ?? {};

  const discountCodes: string[] = (raw?.discountCodes ?? [])
    .filter((d: any) => d.applicable)
    .map((d: any) => d.code as string);

  return {
    shopifyCartId: raw?.id ?? '',
    checkoutUrl: raw?.checkoutUrl ?? '',
    totalQuantity: raw?.totalQuantity ?? lines.reduce((s, l) => s + l.quantity, 0),
    lines,
    subtotal: subtotalAmount.amount ?? '0',
    total: totalAmount.amount ?? '0',
    currency: totalAmount.currencyCode ?? 'INR',
    discountCodes,
  };
}


// ─── Constants ────────────────────────────────────────────────────────────────

const CART_ID_KEY = 'gehnok_shopify_cart_id';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseShopifyCartResult {
  /** Items in the legacy CartItem format for Cart.tsx compatibility */
  cartItems: CartItem[];
  /** Shopify cart line data (extended) */
  cartLines: NormalizedCartLine[];
  /** Total item count for the header badge */
  cartCount: number;
  /** Shopify checkout URL — redirect here on "Proceed to Settlement" */
  checkoutUrl: string | null;
  /** Subtotal formatted for display */
  subtotal: number;
  /** Applied discount codes */
  discountCodes: string[];
  /** Loading state for any in-flight operation */
  loading: boolean;
  /** Cart operation error */
  error: string | null;
  /** Whether Shopify cart is available (false = using local fallback) */
  isShopifyCart: boolean;

  // ── Actions ──
  addItem: (product: Product, quantity: number, metalName: string, priceFactor: number, size: string) => Promise<void>;
  removeItem: (productId: string, metal?: string, size?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, metal?: string, size?: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>;
  clearCart: () => void;
}

// ─── Helper: find the Shopify line ID for a given product+options ─────────────

function findLineId(
  lines: NormalizedCartLine[],
  productHandle: string,
  metal?: string,
  size?: string
): string | undefined {
  return lines.find(
    l =>
      l.productHandle === productHandle &&
      (!metal || l.selectedMetal === metal) &&
      (!size || l.selectedSize === size)
  )?.lineId;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShopifyCart(): UseShopifyCartResult {
  const [cart, setCart] = useState<NormalizedCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShopifyCart, setIsShopifyCart] = useState(true);

  // ── Local fallback state (mirrors existing App.tsx cart logic exactly) ──
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);
  const localCartRef = useRef(localCartItems);
  localCartRef.current = localCartItems;

  // Load local fallback from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gehnok_cart');
      if (stored) setLocalCartItems(JSON.parse(stored));
    } catch {}
  }, []);

  const saveLocal = useCallback((items: CartItem[]) => {
    setLocalCartItems(items);
    localStorage.setItem('gehnok_cart', JSON.stringify(items));
  }, []);

  // ── Cart API helpers ──────────────────────────────────────────────────────

  const fetchCartById = useCallback(async (cartId: string): Promise<NormalizedCart | null> => {
    const res = await fetch(`/api/shopify/cart/${encodeURIComponent(cartId)}`);
    if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return normalizeRawCart(data.cart);
  }, []);

  const createCart = useCallback(async (): Promise<NormalizedCart> => {
    const res = await fetch('/api/shopify/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: [] }),
    });
    if (!res.ok) throw new Error(`Cart creation failed: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return normalizeRawCart(data.cart);
  }, []);

  useEffect(() => {
    (async () => {
      const storedId = localStorage.getItem(CART_ID_KEY);
      // Validate the stored ID isn't a string literal 'undefined', 'null', or empty
      const isValidId = storedId && storedId !== 'undefined' && storedId !== 'null' && storedId.length > 5;
      
      setLoading(true);
      try {
        let activeCart: NormalizedCart;
        if (isValidId) {
          activeCart = await fetchCartById(storedId as string);
        } else {
          activeCart = await createCart();
          if (activeCart?.shopifyCartId) {
            localStorage.setItem(CART_ID_KEY, activeCart.shopifyCartId);
          }
        }
        setCart(activeCart);
        setIsShopifyCart(true);
      } catch (err) {
        console.warn('[useShopifyCart] Shopify unavailable or cart invalid, using local fallback:', err);
        // If the ID was invalid or expired, clear it so we can create a fresh one next time
        if (isValidId) {
          localStorage.removeItem(CART_ID_KEY);
        }
        setIsShopifyCart(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCartById, createCart]);

  // ── Derived values ──────────────────────────────────────────────────────

  const cartLines: NormalizedCartLine[] = cart?.lines ?? [];
  const cartItems: CartItem[] = isShopifyCart
    ? [...cartLines.map(normalizedLineToLegacyCartItem), ...localCartItems]
    : localCartItems;

  const cartCount = isShopifyCart
    ? (cart?.totalQuantity ?? 0) + localCartItems.reduce((s, i) => s + i.quantity, 0)
    : localCartItems.reduce((s, i) => s + i.quantity, 0);

  const subtotal = isShopifyCart
    ? cartLines.reduce((s, l) => s + l.price * l.quantity, 0) + localCartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
    : localCartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const checkoutUrl = cart?.checkoutUrl ?? null;
  const discountCodes = cart?.discountCodes ?? [];

  // ── Actions: Shopify path ─────────────────────────────────────────────────

  const addItem = useCallback(async (
    product: Product,
    quantity: number,
    metalName: string,
    priceFactor: number,
    size: string
  ) => {
    if (!isShopifyCart) {
      // ── Local fallback: replicate existing App.tsx logic exactly ──
      const adjustedPrice = Math.round(product.price * priceFactor);
      const customProduct = { ...product, price: adjustedPrice, metal: metalName as any };
      const items = localCartRef.current;
      const existing = items.findIndex(
        i => i.product.id === product.id && i.selectedMetal === metalName && i.selectedSize === size
      );
      if (existing > -1) {
        const updated = [...items];
        updated[existing].quantity += quantity;
        saveLocal(updated);
      } else {
        saveLocal([...items, { product: customProduct, quantity, selectedMetal: metalName, selectedSize: size }]);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cartId = cart?.shopifyCartId ?? localStorage.getItem(CART_ID_KEY);
      if (!cartId) throw new Error('No cart ID');

      // Find the matching variant for this product+options
      const variantRes = await fetch(
        `/api/shopify/products/${encodeURIComponent(product.id)}/variant?metal=${encodeURIComponent(metalName)}&size=${encodeURIComponent(size)}`
      );
      const variantData = await variantRes.json();
      const variantId = variantData.variantId;

      if (!variantId) throw new Error('Variant not found for options');

      const res = await fetch(`/api/shopify/cart/${encodeURIComponent(cartId)}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: [{ merchandiseId: variantId, quantity }] }),
      });
      if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCart(normalizeRawCart(data.cart));
    } catch (err) {
      console.error('[useShopifyCart] addItem failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item');
      // Fallback to local on error
      const adjustedPrice = Math.round(product.price * priceFactor);
      const customProduct = { ...product, price: adjustedPrice, metal: metalName as any };
      const items = localCartRef.current;
      saveLocal([...items, { product: customProduct, quantity, selectedMetal: metalName, selectedSize: size }]);
    } finally {
      setLoading(false);
    }
  }, [cart, isShopifyCart, saveLocal]);

  const removeItem = useCallback(async (productId: string, metal?: string, size?: string) => {
    if (!isShopifyCart) {
      saveLocal(
        localCartRef.current.filter(
          i => !(i.product.id === productId && i.selectedMetal === metal && i.selectedSize === size)
        )
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cartId = cart?.shopifyCartId ?? localStorage.getItem(CART_ID_KEY);
      if (!cartId) throw new Error('No cart ID');

      const lineId = findLineId(cartLines, productId, metal, size);
      if (!lineId) {
        // Not in Shopify cart; could be a local mock product. Remove from local storage.
        saveLocal(
          localCartRef.current.filter(
            i => !(i.product.id === productId && i.selectedMetal === metal && i.selectedSize === size)
          )
        );
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/shopify/cart/${encodeURIComponent(cartId)}/lines/${encodeURIComponent(lineId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Remove failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCart(normalizeRawCart(data.cart));
    } catch (err) {
      console.error('[useShopifyCart] removeItem failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  }, [cart, cartLines, isShopifyCart, saveLocal]);

  const updateQuantity = useCallback(async (
    productId: string,
    quantity: number,
    metal?: string,
    size?: string
  ) => {
    if (!isShopifyCart) {
      saveLocal(
        localCartRef.current.map(i =>
          i.product.id === productId && i.selectedMetal === metal && i.selectedSize === size
            ? { ...i, quantity }
            : i
        )
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cartId = cart?.shopifyCartId ?? localStorage.getItem(CART_ID_KEY);
      if (!cartId) throw new Error('No cart ID');

      const lineId = findLineId(cartLines, productId, metal, size);
      if (!lineId) {
        // Not in Shopify cart; could be a local mock product. Update in local storage.
        saveLocal(
          localCartRef.current.map(i =>
            i.product.id === productId && i.selectedMetal === metal && i.selectedSize === size
              ? { ...i, quantity }
              : i
          )
        );
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/shopify/cart/${encodeURIComponent(cartId)}/lines/${encodeURIComponent(lineId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCart(normalizeRawCart(data.cart));
    } catch (err) {
      console.error('[useShopifyCart] updateQuantity failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  }, [cart, cartLines, isShopifyCart, saveLocal]);

  const applyDiscount = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!isShopifyCart || !cart) return { success: false, message: 'Shopify cart not available' };
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify/cart/${encodeURIComponent(cart.shopifyCartId)}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCodes: [code] }),
      });
      const data = await res.json();
      if (data.error) return { success: false, message: data.error };
      const normalized = normalizeRawCart(data.cart);
      setCart(normalized);
      const applied = normalized.discountCodes.includes(code);
      return {
        success: applied,
        message: applied ? 'Discount applied successfully.' : 'Code is not applicable to this cart.',
      };
    } catch (err) {
      return { success: false, message: 'Failed to apply discount.' };
    } finally {
      setLoading(false);
    }
  }, [cart, isShopifyCart]);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY);
    localStorage.removeItem('gehnok_cart');
    setCart(null);
    setLocalCartItems([]);
  }, []);

  return {
    cartItems,
    cartLines,
    cartCount,
    checkoutUrl,
    subtotal,
    discountCodes,
    loading,
    error,
    isShopifyCart,
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    clearCart,
  };
}
