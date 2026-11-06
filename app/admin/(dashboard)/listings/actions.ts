'use server';

import { revalidatePath } from 'next/cache';
import { ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';

type Result = { error: string } | { ok: true };

// Ops decision on a flagged listing. Approve puts it live; reject sends it back
// to the seller with a reason they can read. Only a listing still waiting for
// review can be decided, so two reviewers cannot overwrite each other.
export async function decideListingAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const listingId = String(formData.get('listingId') ?? '');
    const decision = String(formData.get('decision') ?? '');
    const note = String(formData.get('note') ?? '').trim().slice(0, 500);
    if (decision !== 'approve' && decision !== 'reject') throw new Error('Choose approve or reject.');
    if (decision === 'reject' && note.length < 3) throw new Error('Tell the seller why it was rejected.');

    const listing = await prisma.sellerListing.findUnique({ where: { id: listingId }, include: { material: { select: { name: true } } } });
    if (!listing) throw new Error('That listing no longer exists.');

    const moved = await prisma.sellerListing.updateMany({
      where: { id: listingId, status: ListingStatus.PENDING_REVIEW },
      data: {
        status: decision === 'approve' ? ListingStatus.ACTIVE : ListingStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: admin.id,
        reviewNote: note || null,
      },
    });
    if (moved.count === 0) throw new Error('Someone else already decided this listing.');

    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: decision === 'approve' ? 'listing.approved' : 'listing.rejected',
      entityType: 'SellerListing',
      entityId: listingId,
      summary: `${decision === 'approve' ? 'Approved' : 'Rejected'} ${listing.material.name}${note ? `: ${note}` : ''}`,
    });

    revalidatePath('/admin/listings');
    revalidatePath('/seller/listings');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save that decision.' };
  }
}
