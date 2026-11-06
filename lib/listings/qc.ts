import { ListingQcResult } from '@prisma/client';

// Upload checks for a seller listing (docs/floot-port-notes.md 1c). Only a
// listing the checks flag goes to ops; the rest go live on their own. Every
// outcome carries reason codes so both the seller and ops can see why.

export const QC = {
  minPhotoPx: 1000,
  maxPhotoBytes: 5 * 1024 * 1024,
  priceBandLow: 0.5,
  priceBandHigh: 1.5,
  perishableMinShelfLifeDays: 30,
} as const;

export type QcReason =
  | 'NO_PHOTO'
  | 'PHOTO_TOO_SMALL'
  | 'PHOTO_TOO_LARGE'
  | 'PRICE_OUT_OF_RANGE'
  | 'SHELF_LIFE_MISSING'
  | 'SHELF_LIFE_SHORT'
  | 'POSSIBLE_DUPLICATE'
  | 'PRICE_INVALID';

export const QC_REASON_TEXT: Record<QcReason, string> = {
  NO_PHOTO: 'Add at least one photo.',
  PHOTO_TOO_SMALL: `Photos must be at least ${QC.minPhotoPx}px on the shorter side.`,
  PHOTO_TOO_LARGE: 'Photos must be 5 MB or smaller.',
  PRICE_OUT_OF_RANGE: 'The price is far from what other sellers charge, so ops will check it.',
  SHELF_LIFE_MISSING: 'Perishable items need a shelf life.',
  SHELF_LIFE_SHORT: `Perishable items need at least ${QC.perishableMinShelfLifeDays} days of shelf life.`,
  POSSIBLE_DUPLICATE: 'A photo matches another listing, so ops will check it.',
  PRICE_INVALID: 'Enter a price above zero.',
};

export interface QcPhoto {
  widthPx: number;
  heightPx: number;
  sizeBytes: number;
}

export interface QcInput {
  price: number;
  // Median price of the other ACTIVE listings for this material; null when
  // there are none yet (the first seller sets the benchmark).
  medianPrice: number | null;
  perishable: boolean;
  shelfLifeDays: number | null;
  photos: QcPhoto[];
  duplicatePhoto: boolean;
}

export interface QcOutcome {
  result: ListingQcResult;
  reasons: QcReason[];
}

// Reasons that block the listing outright: the seller must fix them.
const REJECT: ReadonlySet<QcReason> = new Set([
  'NO_PHOTO',
  'PHOTO_TOO_SMALL',
  'PHOTO_TOO_LARGE',
  'SHELF_LIFE_MISSING',
  'SHELF_LIFE_SHORT',
  'PRICE_INVALID',
]);

export function runListingQc(input: QcInput): QcOutcome {
  const reasons: QcReason[] = [];

  if (!(input.price > 0)) reasons.push('PRICE_INVALID');

  if (input.photos.length === 0) reasons.push('NO_PHOTO');
  if (input.photos.some((p) => Math.min(p.widthPx, p.heightPx) < QC.minPhotoPx)) reasons.push('PHOTO_TOO_SMALL');
  if (input.photos.some((p) => p.sizeBytes > QC.maxPhotoBytes)) reasons.push('PHOTO_TOO_LARGE');

  if (input.perishable) {
    if (input.shelfLifeDays == null) reasons.push('SHELF_LIFE_MISSING');
    else if (input.shelfLifeDays < QC.perishableMinShelfLifeDays) reasons.push('SHELF_LIFE_SHORT');
  }

  if (input.medianPrice != null && input.price > 0) {
    const ratio = input.price / input.medianPrice;
    if (ratio < QC.priceBandLow || ratio > QC.priceBandHigh) reasons.push('PRICE_OUT_OF_RANGE');
  }

  if (input.duplicatePhoto) reasons.push('POSSIBLE_DUPLICATE');

  if (reasons.some((r) => REJECT.has(r))) return { result: ListingQcResult.REJECTED, reasons };
  if (reasons.length > 0) return { result: ListingQcResult.NEEDS_REVIEW, reasons };
  return { result: ListingQcResult.PASSED, reasons };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
