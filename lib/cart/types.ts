export interface CartLine {
  materialId: string;
  name: string;
  unit: string;
  category: string;
  catalogPrice: number;
  imageUrl: string | null;
  quantity: number;
  // The seller offer picked for this line. When set, unitPrice is that offer's
  // price; otherwise the catalogue price applies. Optional so carts saved
  // before sellers could list still load.
  listingId?: string | null;
  sellerName?: string | null;
  unitPrice?: number;
}

// The price one unit of this line costs the buyer.
export function linePrice(line: Pick<CartLine, 'catalogPrice' | 'unitPrice'>): number {
  return line.unitPrice ?? line.catalogPrice;
}
