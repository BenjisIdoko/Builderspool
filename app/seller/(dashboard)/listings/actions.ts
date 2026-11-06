'use server';

import { revalidatePath } from 'next/cache';
import { KycStatus, ListingQcResult, ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSellerActor } from '@/lib/seller/session';
import { recordAudit } from '@/lib/audit';
import { median, runListingQc } from '@/lib/listings/qc';
import { deleteListingPhotoFile, isListingUploadConfigured, uploadListingPhoto } from '@/lib/storage/listingPhotos';

type Result = { error: string } | { ok: true; message: string };

const STATUS_FOR: Record<ListingQcResult, ListingStatus> = {
  PASSED: ListingStatus.ACTIVE,
  NEEDS_REVIEW: ListingStatus.PENDING_REVIEW,
  REJECTED: ListingStatus.REJECTED,
};

function intField(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? '').trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : NaN;
}

// Saves a seller's listing for one material, stores any new photos, then runs
// the upload checks. A listing that passes goes live by itself; one the checks
// flag waits for ops; one that fails tells the seller what to fix.
export async function saveListingAction(formData: FormData): Promise<Result> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };

  try {
    const materialId = String(formData.get('materialId') ?? '');
    const price = Number(String(formData.get('price') ?? '').replace(/,/g, ''));
    const stockQty = intField(formData, 'stockQty');
    const leadTimeDays = intField(formData, 'leadTimeDays');
    const shelfLifeDays = intField(formData, 'shelfLifeDays');

    if (!materialId) return { error: 'Choose a product.' };
    if (!Number.isFinite(price) || price <= 0) return { error: 'Enter a price above zero.' };
    if (stockQty == null || Number.isNaN(stockQty) || stockQty < 0) return { error: 'Enter your stock as a whole number.' };
    if (leadTimeDays == null || Number.isNaN(leadTimeDays) || leadTimeDays < 0) return { error: 'Enter the lead time in whole days.' };
    if (shelfLifeDays != null && (Number.isNaN(shelfLifeDays) || shelfLifeDays < 0)) return { error: 'Enter the shelf life in whole days.' };

    const [material, profile] = await Promise.all([
      prisma.material.findFirst({ where: { id: materialId, retired: false, needsPriceReview: false } }),
      prisma.sellerProfile.findUnique({ where: { userId: actor.sellerId }, select: { kycStatus: true } }),
    ]);
    if (!material) return { error: 'That product is not available.' };

    const existing = await prisma.sellerListing.findUnique({
      where: { sellerId_materialId: { sellerId: actor.sellerId, materialId } },
      include: { photos: true },
    });

    const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 0 && !isListingUploadConfigured()) return { error: 'Photo upload is not switched on yet. Ask the BuildersPool team.' };

    const stored = [];
    try {
      for (const file of files) stored.push(await uploadListingPhoto(actor.sellerId, file));
    } catch (err) {
      await Promise.all(stored.map((s) => deleteListingPhotoFile(s.path)));
      return { error: err instanceof Error ? err.message : 'Photo upload failed.' };
    }

    const listing = await prisma.sellerListing.upsert({
      where: { sellerId_materialId: { sellerId: actor.sellerId, materialId } },
      create: { sellerId: actor.sellerId, materialId, price, stockQty, leadTimeDays, shelfLifeDays },
      update: { price, stockQty, leadTimeDays, shelfLifeDays },
    });
    if (stored.length > 0) {
      const base = existing?.photos.length ?? 0;
      await prisma.listingPhoto.createMany({ data: stored.map((s, i) => ({ listingId: listing.id, ...s, sortOrder: base + i })) });
    }

    const photos = await prisma.listingPhoto.findMany({ where: { listingId: listing.id }, orderBy: { sortOrder: 'asc' } });
    const others = await prisma.sellerListing.findMany({
      where: { materialId, status: ListingStatus.ACTIVE, NOT: { sellerId: actor.sellerId } },
      select: { price: true },
    });
    const medianPrice = median(others.map((o) => Number(o.price)));
    const qc = runListingQc({
      price,
      medianPrice,
      perishable: material.perishable,
      shelfLifeDays,
      photos,
      duplicatePhoto: false,
    });

    // Only a verified seller can go live; everyone else stays a draft that is
    // saved but invisible to buyers.
    const verified = profile?.kycStatus === KycStatus.APPROVED;
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
    await recordAudit({
      actor: { id: actor.userId, role: actor.isOwner ? 'SELLER' : 'SELLER_STAFF' },
      action: existing ? 'listing.updated' : 'listing.created',
      entityType: 'SellerListing',
      entityId: listing.id,
      summary: `${material.name}: check ${qc.result}${qc.reasons.length ? ` (${qc.reasons.join(', ')})` : ''}`,
    });

    revalidatePath('/seller/listings');
    if (qc.result === ListingQcResult.REJECTED) return { error: 'Saved, but it cannot go live yet. See what to fix below.' };
    if (qc.result === ListingQcResult.NEEDS_REVIEW) return { ok: true, message: 'Saved. Our team will check it before it goes live.' };
    if (!verified) return { ok: true, message: 'Saved as a draft. It goes live once your KYC is verified.' };
    return { ok: true, message: 'Saved and live.' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save the listing.' };
  }
}

// A seller can switch a live listing off and back on. Anything flagged or
// rejected has to go through the checks again by saving.
export async function setListingPausedAction(listingId: string, paused: boolean): Promise<Result> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };

  const listing = await prisma.sellerListing.findFirst({ where: { id: listingId, sellerId: actor.sellerId } });
  if (!listing) return { error: 'Listing not found.' };

  const from = paused ? ListingStatus.ACTIVE : ListingStatus.PAUSED;
  if (listing.status !== from) return { error: paused ? 'Only a live listing can be paused.' : 'Only a paused listing can be resumed.' };

  await prisma.sellerListing.update({ where: { id: listing.id }, data: { status: paused ? ListingStatus.PAUSED : ListingStatus.ACTIVE } });
  await recordAudit({
    actor: { id: actor.userId, role: actor.isOwner ? 'SELLER' : 'SELLER_STAFF' },
    action: paused ? 'listing.paused' : 'listing.resumed',
    entityType: 'SellerListing',
    entityId: listing.id,
    summary: paused ? 'Paused a listing' : 'Resumed a listing',
  });
  revalidatePath('/seller/listings');
  return { ok: true, message: paused ? 'Paused.' : 'Live again.' };
}

export async function removeListingPhotoAction(photoId: string): Promise<Result> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };

  const photo = await prisma.listingPhoto.findFirst({ where: { id: photoId, listing: { sellerId: actor.sellerId } } });
  if (!photo) return { error: 'Photo not found.' };

  await prisma.listingPhoto.delete({ where: { id: photo.id } });
  await deleteListingPhotoFile(photo.path);
  // Fewer photos can break the checks, so a live listing goes back to draft
  // until it is saved again.
  await prisma.sellerListing.updateMany({
    where: { id: photo.listingId, status: ListingStatus.ACTIVE },
    data: { status: ListingStatus.DRAFT, qcResult: null, qcReasons: [] },
  });
  revalidatePath('/seller/listings');
  return { ok: true, message: 'Photo removed. Save the listing again to put it live.' };
}
