// The most a vendor may bid for one sheet line. Normally the frozen reference
// price (lowest live listing in the zone). A line frozen with no reference, because
// no seller serving the zone had a listing, is capped at the lowest price any buyer
// paid for it, so a bid can never cost more than a buyer was charged.
export type Ceiling = { price: number; basis: 'REFERENCE' | 'BUYER_PRICE' };

export function lineCeiling(referencePrice: number | null, buyerPrices: number[]): Ceiling | null {
  if (referencePrice !== null) return { price: referencePrice, basis: 'REFERENCE' };
  if (buyerPrices.length === 0) return null;
  return { price: Math.min(...buyerPrices), basis: 'BUYER_PRICE' };
}
