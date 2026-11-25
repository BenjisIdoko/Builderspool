import { ListingQcResult, ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { median, runListingQc } from '@/lib/listings/qc';

const STATUS_FOR: Record<ListingQcResult, ListingStatus> = {
  PASSED: ListingStatus.ACTIVE,
  NEEDS_REVIEW: ListingStatus.PENDING_REVIEW,
  REJECTED: ListingStatus.REJECTED,
};

export type CheckedListing = { id: string; materialId: string; price: unknown; shelfLifeDays: number | null; sellerId: string };

/**
 * Runs the upload checks on a listing's current photos and sets its status from
 * the outcome. Shared by saving, by removing a photo and by KYC approval, so all
 * of them treat a listing the same way: still good stays live, anything else
 * says what to fix.
 *
 * Only a verified seller can go live; everyone else's passing listing stays a
 * draft that is saved but invisible to buyers, until `publishDraftListingsForSeller`
 * runs when their KYC is approved.
 */
export async function applyListingChecks(listing: CheckedListing, perishable: boolean, verified: boolean) {
  const photos = await prisma.listingPhoto.findMany({ where: { listingId: listing.id }, orderBy: { sortOrder: 'asc' } });
  const others = await prisma.sellerListing.findMany({
    where: { materialId: listing.materialId, status: ListingStatus.ACTIVE, NOT: { sellerId: listing.sellerId } },
    select: { price: true },
  });
  const medianPrice = median(others.map((o) => Number(o.price)));
  const qc = runListingQc({
    price: Number(listing.price),
    medianPrice,
    perishable,
    shelfLifeDays: listing.shelfLifeDays,
    photos,
    duplicatePhoto: false,
  });
  const status = qc.result === ListingQcResult.PASSED && !verified ? ListingStatus.DRAFT : STATUS_FOR[qc.result];
  await prisma.sellerListing.update({
    where: { id: listing.id },
    data: {
      status,
      qcResult: qc.result,
      qcReasons: qc.reasons,
      qcMedianPrice: medianPrice,
      qcCheckedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
      reviewNote: null,
    },
  });
  return qc;
}

/**
 * Called when a seller becomes verified (KYC approved, or reactivated after a
 * suspension). Listings the seller saved before that passed the checks but were
 * held as drafts; this runs the checks again on each and lets the good ones go
 * live, so approval actually puts the seller's products in front of buyers.
 */
export async function publishDraftListingsForSeller(sellerId: string) {
  const drafts = await prisma.sellerListing.findMany({
    where: { sellerId, status: ListingStatus.DRAFT },
    select: { id: true, materialId: true, price: true, shelfLifeDays: true, sellerId: true, material: { select: { perishable: true } } },
  });
  const report = { live: 0, inReview: 0, needFixing: 0 };
  for (const d of drafts) {
    const qc = await applyListingChecks(d, d.material.perishable, true);
    if (qc.result === ListingQcResult.PASSED) report.live += 1;
    else if (qc.result === ListingQcResult.NEEDS_REVIEW) report.inReview += 1;
    else report.needFixing += 1;
  }
  return report;
}
