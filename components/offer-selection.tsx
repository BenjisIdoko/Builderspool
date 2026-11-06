'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Offer } from '@/lib/queries/offers';

interface OfferSelection {
  offers: Offer[];
  selected: Offer | null;
  select: (offerId: string) => void;
}

const OfferSelectionContext = createContext<OfferSelection | null>(null);

// Holds which seller offer the buyer has picked on a product page, so the offers
// list, the buy box and the headline price all agree. Defaults to the cheapest
// offer (offers arrive cheapest first); no offers means no pick.
export function OfferSelectionProvider({ offers, children }: { offers: Offer[]; children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(offers[0]?.id ?? null);
  const value = useMemo<OfferSelection>(
    () => ({ offers, selected: offers.find((o) => o.id === selectedId) ?? offers[0] ?? null, select: setSelectedId }),
    [offers, selectedId],
  );
  return <OfferSelectionContext.Provider value={value}>{children}</OfferSelectionContext.Provider>;
}

export function useOfferSelection(): OfferSelection {
  const ctx = useContext(OfferSelectionContext);
  if (!ctx) throw new Error('useOfferSelection must be used within an OfferSelectionProvider');
  return ctx;
}
