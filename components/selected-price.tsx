'use client';

import { formatNaira } from '@/lib/format';
import { useOfferSelection } from '@/components/offer-selection';

// The product's headline price: the picked seller offer, or the catalogue price
// when no seller has a live offer.
export function SelectedPrice({ catalogPrice }: { catalogPrice: number }) {
  const { selected } = useOfferSelection();
  return <>{formatNaira(selected?.price ?? catalogPrice)}</>;
}
