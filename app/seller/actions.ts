'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { AllocationStatus, BidStatus, CycleStatus, Role } from '@prisma/client';
import { SELLER_SESSION, getSellerIdFromSession } from '@/lib/seller/session';
import { createSession, destroySession, SESSION_TTL } from '@/lib/auth/sessionStore';
import { isSellerEligible } from '@/lib/bidding/scoring';
import { isPastCutoff } from '@/lib/bidding/cycleWindow';
import { releaseAllocation } from '@/lib/bidding/fallback';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { assertNotRateLimited, recordLoginAttempt } from '@/lib/auth/rateLimit';
import { sendVerificationForNewUser } from '@/lib/auth/emailVerification';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications';

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

    await assertNotRateLimited(email);

    const user = await prisma.user.findUnique({ where: { email }, include: { staffMembership: true } });
    const isSellerLogin =
      !!user && (user.role === Role.SELLER || (user.role === Role.SELLER_STAFF && !!user.staffMembership));
    if (!user || !isSellerLogin || !user.passwordHash) {
      await recordLoginAttempt(email, false);
      throw new Error('No seller account matches that email and password.');
    }
    if (user.disabledAt) {
      await recordLoginAttempt(email, false);
      throw new Error('This account has been disabled. Contact the account owner or BuildersPool support.');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, false);
      throw new Error('No seller account matches that email and password.');
    }
    await recordLoginAttempt(email, true);

    await createSession(SELLER_SESSION, user.id, { ttlMs: SESSION_TTL.seller, persistent: true });
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
    await sendVerificationForNewUser(user.id, user.email);

    await createSession(SELLER_SESSION, user.id, { ttlMs: SESSION_TTL.seller, persistent: true });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create your seller account.' };
  }
}

export async function signOutSeller() {
  await destroySession(SELLER_SESSION);
  redirect('/seller/login');
}

export async function submitBid(formData: FormData) {
  // The submitting seller is always the session's own id — never a
  // client-supplied value. A hidden form field can be edited in devtools,
  // and trusting it would let anyone submit or amend a bid as any other
  // seller, which is exactly the invisibility guarantee blind bidding
  // depends on.
  const sellerId = await getSellerIdFromSession();
  const cycleId = formData.get('cycleId');
  const unitPrice = Number(formData.get('unitPrice'));
  const quantityOffered = Number(formData.get('quantityOffered'));
  const estimatedDeliveryDays = Number(formData.get('estimatedDeliveryDays'));

  if (!sellerId) throw new Error('Sign in as a seller to bid.');
  if (typeof cycleId !== 'string') {
    throw new Error('Missing cycle id.');
  }
  if (!(unitPrice > 0) || !(quantityOffered > 0) || !Number.isFinite(estimatedDeliveryDays) || estimatedDeliveryDays < 0) {
    throw new Error('Enter a valid price, quantity and delivery estimate.');
  }

  const [cycle, profile] = await Promise.all([
    prisma.bidCycle.findUniqueOrThrow({ where: { id: cycleId } }),
    prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } }),
  ]);

  // cycle.status alone isn't a reliable deadline — it only flips to CLOSED
  // when the cron sweeps it, which can lag the real cutoff by several
  // minutes. Checking cutoffAt directly closes that grace-window gap, where
  // a seller could otherwise submit or amend a bid after the deadline every
  // other seller was told applied.
  if (cycle.status === CycleStatus.OPEN) {
    throw new Error('Bidding for this pool opens when it closes to new demand.');
  }
  if (cycle.status !== CycleStatus.BIDDING || isPastCutoff(cycle.bidsCloseAt ?? cycle.cutoffAt)) {
    throw new Error('This cycle is no longer accepting bids.');
  }
  if (profile.kycStatus !== 'APPROVED') {
    throw new Error(
      profile.kycStatus === 'SUSPENDED'
        ? 'Your account is suspended, so you cannot bid. Contact BuildersPool support.'
        : 'Your account must pass KYC review before you can bid.',
    );
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
  const sellerId = await getSellerIdFromSession();
  const bidId = formData.get('bidId');
  if (!sellerId) throw new Error('Sign in as a seller to withdraw a bid.');
  if (typeof bidId !== 'string') {
    throw new Error('Missing bid id.');
  }

  const bid = await prisma.bid.findUniqueOrThrow({ where: { id: bidId }, include: { cycle: true } });
  if (bid.sellerId !== sellerId) throw new Error('Not your bid.');
  if (bid.status !== BidStatus.SUBMITTED) throw new Error('Only a submitted bid can be withdrawn.');
  if (bid.cycle.status !== CycleStatus.BIDDING || isPastCutoff(bid.cycle.bidsCloseAt ?? bid.cycle.cutoffAt)) {
    throw new Error('This cycle has passed its cutoff — bids can no longer be withdrawn.');
  }

  await prisma.bid.update({ where: { id: bidId }, data: { status: BidStatus.WITHDRAWN } });

  revalidatePath('/seller');
  revalidatePath('/seller/bids');
}

// Accepting or declining an award (Transfer File 5.4). Both return their
// errors as data for the same reason signInSeller does.
async function loadOwnAward(allocationId: unknown) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) throw new Error('Sign in as a seller to respond to an award.');
  if (typeof allocationId !== 'string') throw new Error('Missing award id.');
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId }, include: { bid: true } });
  if (!allocation || allocation.bid.sellerId !== sellerId) throw new Error('Not your award.');
  return allocation;
}

function awardNoLongerWaiting(status: AllocationStatus, cancelReason: string | null): string {
  if (status === AllocationStatus.CANCELLED) {
    return cancelReason === 'EXPIRED' ? 'The time to accept this award has passed.' : 'This award has been withdrawn.';
  }
  return 'This award has already been accepted.';
}

export async function acceptAllocation(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const allocation = await loadOwnAward(formData.get('allocationId'));
    const now = new Date();

    const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: allocation.bid.sellerId } });
    if (profile.kycStatus !== 'APPROVED') throw new Error('Your account is not approved, so you cannot accept awards.');

    // Compare-and-swap: only a still-waiting award inside its accept window.
    const { count } = await prisma.allocation.updateMany({
      where: {
        id: allocation.id,
        status: AllocationStatus.PENDING,
        OR: [{ acceptDeadlineAt: null }, { acceptDeadlineAt: { gt: now } }],
      },
      data: { status: AllocationStatus.CONFIRMED, acceptedAt: now },
    });
    if (count === 0) {
      const fresh = await prisma.allocation.findUniqueOrThrow({ where: { id: allocation.id } });
      throw new Error(
        fresh.status === AllocationStatus.PENDING
          ? 'The time to accept this award has passed.'
          : awardNoLongerWaiting(fresh.status, fresh.cancelReason),
      );
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not accept this award.' };
  }
  revalidatePath('/seller/allocations');
  revalidatePath('/seller', 'layout');
}

export async function declineAllocation(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const allocation = await loadOwnAward(formData.get('allocationId'));
    const result = await releaseAllocation(allocation.id, 'DECLINED');
    if (!result.released) {
      const fresh = await prisma.allocation.findUniqueOrThrow({ where: { id: allocation.id } });
      throw new Error(awardNoLongerWaiting(fresh.status, fresh.cancelReason));
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not decline this award.' };
  }
  revalidatePath('/seller/allocations');
  revalidatePath('/seller', 'layout');
}

export async function markNotificationReadAction(formData: FormData) {
  const sellerId = await getSellerIdFromSession();
  const id = formData.get('id');
  if (!sellerId || typeof id !== 'string') return;

  await markNotificationRead(id, sellerId);
  revalidatePath('/seller', 'layout');
}

export async function markAllNotificationsReadAction() {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) return;

  await markAllNotificationsRead(sellerId);
  revalidatePath('/seller', 'layout');
}
