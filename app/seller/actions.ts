'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { BidStatus, CycleStatus, Role } from '@prisma/client';
import { SELLER_COOKIE } from '@/lib/seller/session';
import { isSellerEligible } from '@/lib/bidding/scoring';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

// Errors are caught and returned as plain data (not thrown across the
// server/client boundary) — Next.js redacts a thrown Server Action error's
// message in production builds, replacing it with a generic digest-only
// message on the client. Returning { error } instead sidesteps that
// entirely, since it's just normal serializable data, not an exception.
export async function signInSeller(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const email = requiredText(formData, 'email').toLowerCase();
    const password = requiredText(formData, 'password');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.SELLER || !user.passwordHash) {
      throw new Error('No seller account matches that email and password.');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error('No seller account matches that email and password.');

    const store = await cookies();
    store.set(SELLER_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not sign in.' };
  }
}

export async function signUpSeller(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const name = requiredText(formData, 'name');
    const businessName = requiredText(formData, 'businessName');
    const email = requiredText(formData, 'email').toLowerCase();
    const location = requiredText(formData, 'location');
    const password = requiredText(formData, 'password');
    const confirmPassword = requiredText(formData, 'confirmPassword');

    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('An account with that email already exists.');

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { role: Role.SELLER, name, email, businessName, location, passwordHash },
    });
    // New sellers start with no served region and a neutral trust score —
    // real signals (real deliveries, real GRNs) are what should move
    // trustScore over time, not a number chosen at signup.
    await prisma.sellerProfile.create({
      data: { userId: user.id, regionsServed: [location.toUpperCase()], trustScore: 50 },
    });

    const store = await cookies();
    store.set(SELLER_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create your seller account.' };
  }
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
