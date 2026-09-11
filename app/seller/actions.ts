'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { BidStatus, CycleStatus } from '@prisma/client';
import { SELLER_COOKIE } from '@/lib/seller/session';
import { isSellerEligible } from '@/lib/bidding/scoring';

export async function selectSeller(formData: FormData) {
  const userId = formData.get('userId');
  if (typeof userId !== 'string' || !userId) throw new Error('Missing seller id.');

  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Not a seller account.');

  const store = await cookies();
  store.set(SELLER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/' });
  redirect('/seller');
}

export async function signOutSeller() {
  const store = await cookies();
  store.delete(SELLER_COOKIE);
  redirect('/seller/login');
}

export async function submitBid(formData: FormData) {
  const sellerId = formData.get('sellerId');
  const cycleId = formData.get('cycleId');
  const unitPrice = Number(formData.get('unitPrice'));
  const quantityOffered = Number(formData.get('quantityOffered'));
  const estimatedDeliveryDays = Number(formData.get('estimatedDeliveryDays'));

  if (typeof sellerId !== 'string' || typeof cycleId !== 'string') {
    throw new Error('Missing seller or cycle id.');
  }
  if (!(unitPrice > 0) || !(quantityOffered > 0) || !Number.isFinite(estimatedDeliveryDays) || estimatedDeliveryDays < 0) {
    throw new Error('Enter a valid price, quantity and delivery estimate.');
  }

  const [cycle, profile] = await Promise.all([
    prisma.bidCycle.findUniqueOrThrow({ where: { id: cycleId } }),
    prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } }),
  ]);

  if (cycle.status !== CycleStatus.OPEN) {
    throw new Error('This cycle is no longer accepting bids.');
  }
  if (!isSellerEligible(profile, cycle)) {
    throw new Error("Your account doesn't serve this cycle's region.");
  }

  // One active bid per seller per cycle — resubmitting updates it in place
  // rather than creating a duplicate.
  const existing = await prisma.bid.findFirst({
    where: { sellerId, cycleId, status: BidStatus.SUBMITTED },
  });

  if (existing) {
    await prisma.bid.update({
      where: { id: existing.id },
      data: { unitPrice, quantityOffered, estimatedDeliveryDays },
    });
  } else {
    await prisma.bid.create({
      data: { sellerId, materialId: cycle.materialId, cycleId, unitPrice, quantityOffered, estimatedDeliveryDays },
    });
  }

  revalidatePath('/seller');
  revalidatePath('/seller/bids');
}

export async function withdrawBid(formData: FormData) {
  const bidId = formData.get('bidId');
  const sellerId = formData.get('sellerId');
  if (typeof bidId !== 'string' || typeof sellerId !== 'string') {
    throw new Error('Missing bid id.');
  }

  const bid = await prisma.bid.findUniqueOrThrow({ where: { id: bidId } });
  if (bid.sellerId !== sellerId) throw new Error('Not your bid.');
  if (bid.status !== BidStatus.SUBMITTED) throw new Error('Only a submitted bid can be withdrawn.');

  await prisma.bid.update({ where: { id: bidId }, data: { status: BidStatus.WITHDRAWN } });

  revalidatePath('/seller');
  revalidatePath('/seller/bids');
}
