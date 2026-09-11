'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine {
  materialId: string;
  name: string;
  unit: string;
  category: string;
  catalogPrice: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  updateQuantity: (materialId: string, quantity: number) => void;
  removeItem: (materialId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'builderspool.cart.v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cart lives in localStorage until buyer accounts/auth exist — see
  // BUILDERSPOOL_PROJECT_BRIEF.md's Phase 1 scope note. Reading it in an
  // effect (rather than a useState lazy initializer) is intentional: the
  // initial render must match the server's empty-cart HTML, or React
  // throws a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // corrupt or inaccessible storage — start from an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable (private mode, quota) — cart just won't persist
    }
  }, [lines, hydrated]);

  const addItem = useCallback((item: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.materialId === item.materialId);
      if (existing) {
        return prev.map((l) =>
          l.materialId === item.materialId ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((materialId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.materialId !== materialId);
      return prev.map((l) => (l.materialId === materialId ? { ...l, quantity } : l));
    });
  }, []);

  const removeItem = useCallback((materialId: string) => {
    setLines((prev) => prev.filter((l) => l.materialId !== materialId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.catalogPrice, 0);
    return { lines, itemCount, subtotal, addItem, updateQuantity, removeItem, clear };
  }, [lines, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
