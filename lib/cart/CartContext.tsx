'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from 'react';
import {
  addCartItemAction,
  setCartItemQuantityAction,
  removeCartItemAction,
  clearCartAction,
  mergeGuestCartAction,
} from '@/app/(shop)/cart/actions';
import type { CartLine } from './types';

export type { CartLine };

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

// Signed-out visitors get a localStorage cart, same as before. A signed-in
// buyer's cart lives in the real CartItem table (lib/cart/store.ts) instead,
// so it follows them across devices — initialLines comes from the server
// layout, so a logged-in buyer's cart renders correctly on first paint with
// no loading flash. The one bridge case: a guest who added items, then logs
// in — those localStorage lines get merged into their account cart once,
// then localStorage is cleared.
export function CartProvider({
  children,
  buyerId,
  initialLines = [],
}: {
  children: React.ReactNode;
  buyerId: string | null;
  initialLines?: CartLine[];
}) {
  const [lines, setLines] = useState<CartLine[]>(initialLines);
  const [guestHydrated, setGuestHydrated] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (buyerId) {
      let guestLines: CartLine[] = [];
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) guestLines = JSON.parse(raw);
      } catch {
        // corrupt or inaccessible storage — nothing to merge
      }

      if (guestLines.length > 0) {
        // Cleared synchronously, before the merge even starts — StrictMode's
        // double-invoked effects (or a second mount from a fast navigation
        // while the merge is still in flight) must not re-merge the same
        // guest lines a second time and double their quantity.
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        mergeGuestCartAction(guestLines.map((l) => ({ materialId: l.materialId, quantity: l.quantity })))
          .then((merged) => {
            if (merged) setLines(merged);
          })
          .catch(() => {
            // merge failed silently — the account cart just won't include
            // these lines; nothing left in localStorage to retry from
          });
      }
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // corrupt or inaccessible storage — start from an empty cart
    }
    setGuestHydrated(true);
  }, [buyerId]);

  useEffect(() => {
    if (buyerId || !guestHydrated) return; // real accounts persist server-side, not to localStorage
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable (private mode, quota) — cart just won't persist
    }
  }, [lines, guestHydrated, buyerId]);

  const addItem = useCallback(
    (item: Omit<CartLine, 'quantity'>, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.materialId === item.materialId);
        if (existing) {
          return prev.map((l) =>
            l.materialId === item.materialId ? { ...l, quantity: l.quantity + quantity } : l
          );
        }
        return [...prev, { ...item, quantity }];
      });
      if (buyerId) {
        startTransition(() => {
          addCartItemAction(item.materialId, quantity);
        });
      }
    },
    [buyerId, startTransition]
  );

  const updateQuantity = useCallback(
    (materialId: string, quantity: number) => {
      setLines((prev) => {
        if (quantity <= 0) return prev.filter((l) => l.materialId !== materialId);
        return prev.map((l) => (l.materialId === materialId ? { ...l, quantity } : l));
      });
      if (buyerId) {
        startTransition(() => {
          setCartItemQuantityAction(materialId, quantity);
        });
      }
    },
    [buyerId, startTransition]
  );

  const removeItem = useCallback(
    (materialId: string) => {
      setLines((prev) => prev.filter((l) => l.materialId !== materialId));
      if (buyerId) {
        startTransition(() => {
          removeCartItemAction(materialId);
        });
      }
    },
    [buyerId, startTransition]
  );

  const clear = useCallback(() => {
    setLines([]);
    if (buyerId) {
      // Defense in depth only — checkout's real source of truth is
      // createOrder() clearing the cart atomically in the same transaction
      // as order creation, so this doesn't have to win a race against the
      // page navigation that follows a successful checkout.
      startTransition(() => {
        clearCartAction();
      });
    }
  }, [buyerId, startTransition]);

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
