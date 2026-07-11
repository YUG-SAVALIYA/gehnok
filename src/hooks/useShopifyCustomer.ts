/**
 * GEHNOK Shopify Headless Integration
 * useShopifyCustomer — Customer authentication hook.
 *
 * Implements login, register, logout, and order history via Shopify
 * Customer Storefront API (proxied through Express).
 *
 * Access token is stored in sessionStorage (cleared on tab close).
 * Never stored in localStorage to follow security best practices.
 */

import { useState, useEffect, useCallback } from 'react';
import { createShopifyApiUrl } from '../shopify/api';
import { ShopifyCustomer, ShopifyOrder } from '../shopify/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'gehnok_customer_token';
const TOKEN_EXPIRY_KEY = 'gehnok_customer_token_expiry';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerState {
  isLoggedIn: boolean;
  customer: ShopifyCustomer | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface UseShopifyCustomerResult extends CustomerState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshCustomer: () => Promise<void>;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (new Date(expiry) < new Date()) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresAt: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  } catch { }
}

function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch { }
}

const triggerAuthChange = () => window.dispatchEvent(new Event('gehnok_auth_change'));

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShopifyCustomer(): UseShopifyCustomerResult {
  const [state, setState] = useState<CustomerState>({
    isLoggedIn: false,
    customer: null,
    accessToken: null,
    loading: false,
    error: null,
  });

  // ── Fetch customer details ─────────────────────────────────────────────

  const fetchCustomer = useCallback(async (token: string): Promise<ShopifyCustomer | null> => {
    try {
      const res = await fetch(createShopifyApiUrl('customer'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.customer ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Initialize from stored token on mount ─────────────────────────────

  useEffect(() => {
    const syncState = () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setState(prev => ({ ...prev, isLoggedIn: false, customer: null, accessToken: null, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true }));
      fetchCustomer(storedToken).then(customer => {
        if (customer) {
          setState({
            isLoggedIn: true,
            customer,
            accessToken: storedToken,
            loading: false,
            error: null,
          });
        } else {
          clearToken();
          setState({
            isLoggedIn: false,
            customer: null,
            accessToken: null,
            loading: false,
            error: null,
          });
        }
      });
    };

    syncState();
    window.addEventListener('gehnok_auth_change', syncState);
    return () => window.removeEventListener('gehnok_auth_change', syncState);
  }, [fetchCustomer]);

  // ── Login ─────────────────────────────────────────────────────────────

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(createShopifyApiUrl('customer/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.error || !data.accessToken) {
        setState(prev => ({ ...prev, loading: false, error: data.error || 'Login failed' }));
        return { success: false, message: data.error || 'Invalid credentials.' };
      }

      storeToken(data.accessToken, data.expiresAt);
      triggerAuthChange();
      const customer = await fetchCustomer(data.accessToken);
      setState({
        isLoggedIn: true,
        customer,
        accessToken: data.accessToken,
        loading: false,
        error: null,
      });
      return { success: true, message: `Welcome back, ${customer?.firstName || 'valued client'}.` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setState(prev => ({ ...prev, loading: false, error: msg }));
      return { success: false, message: msg };
    }
  }, [fetchCustomer]);

  // ── Register ──────────────────────────────────────────────────────────

  const register = useCallback(async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(createShopifyApiUrl('customer/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();

      if (data.error) {
        setState(prev => ({ ...prev, loading: false, error: data.error }));
        return { success: false, message: data.error };
      }

      // Auto-login after registration
      setState(prev => ({ ...prev, loading: false }));
      return await login(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setState(prev => ({ ...prev, loading: false, error: msg }));
      return { success: false, message: msg };
    }
  }, [login]);

  // ── Logout ────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    const { accessToken } = state;
    setState(prev => ({ ...prev, loading: true }));
    try {
      if (accessToken) {
        await fetch(createShopifyApiUrl('customer/logout'), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch { } finally {
      clearToken();
      setState({
        isLoggedIn: false,
        customer: null,
        accessToken: null,
        loading: false,
        error: null,
      });
      triggerAuthChange();
    }
  }, [state]);

  // ── Password recovery ─────────────────────────────────────────────────

  const recoverPassword = useCallback(async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(createShopifyApiUrl('customer/recover'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) return { success: false, message: data.error };
      return { success: true, message: 'If an account exists, a recovery link has been dispatched.' };
    } catch {
      return { success: false, message: 'Recovery request failed.' };
    }
  }, []);

  // ── Refresh customer ──────────────────────────────────────────────────

  const refreshCustomer = useCallback(async (): Promise<void> => {
    const { accessToken } = state;
    if (!accessToken) return;
    setState(prev => ({ ...prev, loading: true }));
    const customer = await fetchCustomer(accessToken);
    setState(prev => ({ ...prev, customer, loading: false }));
  }, [state, fetchCustomer]);

  return { ...state, login, register, logout, recoverPassword, refreshCustomer };
}
