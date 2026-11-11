import { redirect } from 'next/navigation';
import { getSellerActor } from '@/lib/seller/session';
import { prisma } from '@/lib/prisma';
import { QC_REASON_TEXT } from '@/lib/listings/qc';
import { isListingUploadConfigured, listingPhotoUrl } from '@/lib/storage/listingPhotos';
import { ListingForm, type ListingFormValues } from '@/components/seller/listing-form';

export const metadata = { title: 'My listings' };

export default async function SellerListingsPage() {
  const actor = await getSellerActor();
  if (!actor) redirect('/seller/login');

  const [listings, materials, profile] = await Promise.all([
    prisma.sellerListing.findMany({
      where: { sellerId: actor.sellerId },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, material: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.material.findMany({
      where: { retired: false, needsPriceReview: false },
      select: { id: true, name: true, unit: true, perishable: true, category: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.sellerProfile.findUnique({ where: { userId: actor.sellerId }, select: { kycStatus: true } }),
  ]);
  const verified = profile?.kycStatus === 'APPROVED';

  const listed = new Set(listings.map((l) => l.materialId));
  const available = materials.filter((m) => !listed.has(m.id));
  const uploadsEnabled = isListingUploadConfigured();
  const reasonText: Record<string, string> = QC_REASON_TEXT;

  const toValues = (l: (typeof listings)[number]): ListingFormValues => ({
    id: l.id,
    materialId: l.materialId,
    price: String(Number(l.price)),
    stockQty: String(l.stockQty),
    leadTimeDays: String(l.leadTimeDays),
    shelfLifeDays: l.shelfLifeDays == null ? '' : String(l.shelfLifeDays),
    status: l.status,
    reasons: l.qcReasons,
    reviewNote: l.reviewNote,
    photos: l.photos.map((p) => ({ id: p.id, url: listingPhotoUrl(p.path), widthPx: p.widthPx, heightPx: p.heightPx })),
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-3xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · listings</div>
      <h1 className="mb-1 text-heading-lg text-ink">My listings</h1>
      <p className="mb-6 text-pretty text-sm text-muted-foreground">
        Set your own price, stock, lead time and photos for each product you sell. Listings that pass our checks go live on
        their own; only flagged ones are reviewed by our team.
      </p>

      <div className="mb-6 overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">Add a listing</h2>
        </div>
        <div className="px-5 py-4">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have listed every product in the catalogue.</p>
          ) : (
            <ListingForm key={listings.length} materials={available} values={null} reasonText={reasonText} uploadsEnabled={uploadsEnabled} verified={verified} />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">Your listings (<span className="tabular-nums">{listings.length}</span>)</h2>
        </div>
        {listings.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No listings yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {listings.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <ListingForm materials={materials} values={toValues(l)} reasonText={reasonText} uploadsEnabled={uploadsEnabled} verified={verified} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
