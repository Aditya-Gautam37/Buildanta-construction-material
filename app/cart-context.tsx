"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchaseMode: "DIRECT_ONLY" | "QUOTE_ONLY" | "DIRECT_AND_QUOTE";
  unit: string;
  unitPriceSnapshot: number | null;
  livePrice: number | null;
  priceChanged: boolean;
  lineSubtotal: number | null;
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ENQUIRY";
  eligible: boolean;
  requiresQuote: boolean;
  quantityAdjusted: boolean;
  issues: string[];
};

export type CartSummary = {
  cartId: string | null;
  status: "ACTIVE" | "CONVERTED" | "ABANDONED" | "EXPIRED";
  lines: CartLine[];
  lineCount: number;
  itemCount: number;
  subtotal: number;
  requiresQuoteCount: number;
  hasBlockingIssues: boolean;
};

const EMPTY_SUMMARY: CartSummary = { cartId: null, status: "ACTIVE", lines: [], lineCount: 0, itemCount: 0, subtotal: 0, requiresQuoteCount: 0, hasBlockingIssues: false };

type CartContextValue = {
  summary: CartSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function parseSummary(response: Response): Promise<{ summary?: CartSummary; error?: string }> {
  const data = await response.json().catch(() => ({})) as { error?: string; message?: string | string[] } & Partial<CartSummary>;
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(" ") : data.message;
    return { error: data.error || message || "The cart service is temporarily unavailable." };
  }
  return { summary: data as CartSummary };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = await parseSummary(response);
      if (result.summary) { setSummary(result.summary); setError(null); } else setError(result.error ?? null);
    } catch {
      setError("The cart service is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const addItem = useCallback(async (variantId: string, quantity: number) => {
    setError(null);
    try {
      const response = await fetch("/api/cart/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, quantity }) });
      const result = await parseSummary(response);
      if (result.summary) { setSummary(result.summary); return true; }
      setError(result.error ?? "Unable to add this product to your cart.");
      return false;
    } catch {
      setError("Unable to add this product to your cart.");
      return false;
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ quantity }) });
      const result = await parseSummary(response);
      if (result.summary) { setSummary(result.summary); return true; }
      setError(result.error ?? "Unable to update this item.");
      return false;
    } catch {
      setError("Unable to update this item.");
      return false;
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
      const result = await parseSummary(response);
      if (result.summary) { setSummary(result.summary); return true; }
      setError(result.error ?? "Unable to remove this item.");
      return false;
    } catch {
      setError("Unable to remove this item.");
      return false;
    }
  }, []);

  const clear = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/cart", { method: "DELETE" });
      const result = await parseSummary(response);
      if (result.summary) setSummary(result.summary);
    } catch {
      setError("Unable to clear your cart.");
    }
  }, []);

  const value = useMemo(
    () => ({ summary, loading, error, refresh, addItem, updateItem, removeItem, clear }),
    [summary, loading, error, refresh, addItem, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
