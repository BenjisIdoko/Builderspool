import { CoverageStatus, ListingStatus, KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import type { Checklist, ChecklistStep } from './types';

// "Get ready to sell": the gates a new seller clears, in order, from their own data. The
// builder is pure (no database, no clock) so every state can be tested on plain data.
export interface SellerSnapshot {
  emailVerified: boolean;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  kycRejectionReason: string | null;
  termsAccepted: boolean;
  nationalSupply: boolean;
  zones: { approved: number; pending: number };
  categories: { approved: number; pending: number };
  listings: { active: number; pendingReview: number; rejected: number };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function buildSellerChecklist(s: SellerSnapshot): Checklist {
  const verified = s.kycStatus === 'APPROVED';
  const steps: ChecklistStep[] = [];

  steps.push(
    s.emailVerified
      ? { id: 'email', title: 'Verify your email', status: 'done', detail: 'Your email is verified.' }
      : { id: 'email', title: 'Verify your email', status: 'todo', detail: 'Open the link we sent you, or resend it from the banner above.' },
  );

  if (s.kycStatus === 'SUSPENDED') {
    steps.push({ id: 'kyc', title: 'Get verified (KYC)', status: 'problem', detail: 'Your account is suspended, so you cannot bid. Contact BuildersPool support.' });
  } else if (s.kycStatus === 'REJECTED') {
    steps.push({
      id: 'kyc',
      title: 'Get verified (KYC)',
      status: 'problem',
      detail: `Not approved${s.kycRejectionReason ? `: ${s.kycRejectionReason}` : ''}. Fix it and submit again.`,
      href: '/seller/kyc',
      cta: 'Fix and resubmit',
    });
  } else if (s.kycStatus === 'PENDING') {
    steps.push({ id: 'kyc', title: 'Get verified (KYC)', status: 'waiting', waitingOn: 'BuildersPool', detail: 'Submitted. BuildersPool is reviewing your details; nothing more is needed from you.' });
  } else if (verified && !s.termsAccepted) {
    steps.push({ id: 'kyc', title: 'Get verified (KYC)', status: 'todo', detail: 'You are verified. Accept the current seller terms to continue.', href: '/seller/kyc', cta: 'Accept the terms' });
  } else if (verified) {
    steps.push({ id: 'kyc', title: 'Get verified (KYC)', status: 'done', detail: 'You are verified and the terms are accepted.' });
  } else {
    steps.push({
      id: 'kyc',
      title: 'Get verified (KYC)',
      status: 'todo',
      detail: 'Submit your business registration, ID, address and bank details, and accept the seller terms.',
      href: '/seller/kyc',
      cta: 'Start KYC',
    });
  }

  const ask = (id: string, title: string, noun: [string, string], approved: number, pending: number, href: string, cta: string, all?: string): ChecklistStep => {
    if (all) return { id, title, status: 'done', detail: all };
    if (approved > 0) return { id, title, status: 'done', detail: `${plural(approved, noun[0], noun[1])} approved.` };
    if (pending > 0) return { id, title, status: 'waiting', waitingOn: 'BuildersPool', detail: `${plural(pending, 'request is', 'requests are')} with BuildersPool for approval.` };
    return { id, title, status: 'todo', detail: `Tell us which ${noun[1]} you supply. BuildersPool approves each one before you can bid.`, href, cta };
  };
  steps.push(
    ask('zones', 'Choose your delivery zones', ['zone', 'zones'], s.zones.approved, s.zones.pending, '/seller/settings', 'Choose zones', s.nationalSupply ? 'You supply every delivery zone, so there is nothing to choose.' : undefined),
  );
  steps.push(ask('categories', 'Choose your product categories', ['category', 'categories'], s.categories.approved, s.categories.pending, '/seller/settings', 'Choose categories'));

  if (s.listings.active > 0) {
    steps.push({ id: 'listing', title: 'Add your first listing', status: 'done', detail: `${plural(s.listings.active, 'listing is', 'listings are')} live.` });
  } else if (s.listings.pendingReview > 0) {
    steps.push({ id: 'listing', title: 'Add your first listing', status: 'waiting', waitingOn: 'BuildersPool', detail: 'Your listing needs a quick review by BuildersPool before it goes live.' });
  } else if (s.listings.rejected > 0) {
    steps.push({ id: 'listing', title: 'Add your first listing', status: 'problem', detail: 'A listing was rejected. Open it to see why, fix it and save again.', href: '/seller/listings', cta: 'Open my listings' });
  } else {
    steps.push({
      id: 'listing',
      title: 'Add your first listing',
      status: 'todo',
      detail: `Add a product with your price, stock and a photo of at least 1000 px.${verified ? '' : ' It goes live once you are verified.'}`,
      href: '/seller/listings',
      cta: 'Add a listing',
    });
  }

  const gated = steps.every((st) => st.status === 'done');
  steps.push(
    gated
      ? { id: 'ready', title: 'Ready to bid', status: 'done', detail: 'You are set up. Requests for your categories and zones open when the pool closes.' }
      : { id: 'ready', title: 'Ready to bid', status: 'blocked', detail: 'When the steps above are done, requests for your categories and zones appear under RFQs at pool close.' },
  );

  // Progress counts the five gates; the final row is the goal they lead to.
  const gates = steps.slice(0, -1);
  const done = gates.filter((x) => x.status === 'done').length;
  return { steps, done, total: gates.length, complete: gated };
}

export async function getSellerSnapshot(sellerId: string): Promise<SellerSnapshot> {
  const [user, profile, termsVersion, zones, categories, listings] = await Promise.all([
    prisma.user.findUnique({ where: { id: sellerId }, select: { emailVerifiedAt: true } }),
    prisma.sellerProfile.findUnique({ where: { userId: sellerId }, select: { kycStatus: true, kycRejectionReason: true, nationalSupply: true, suspendedAt: true } }),
    getSetting<string>('accounts.termsVersion'),
    prisma.sellerZoneCoverage.groupBy({ by: ['status'], where: { sellerId }, _count: { _all: true } }),
    prisma.sellerCategory.groupBy({ by: ['status'], where: { sellerId }, _count: { _all: true } }),
    prisma.sellerListing.groupBy({ by: ['status'], where: { sellerId }, _count: { _all: true } }),
  ]);
  const accepted = await prisma.sellerTermsAcceptance.findFirst({ where: { sellerUserId: sellerId, version: termsVersion }, select: { id: true } });
  const n = <T extends string>(rows: { status: T; _count: { _all: number } }[], status: T) => rows.find((r) => r.status === status)?._count._all ?? 0;

  return {
    emailVerified: !!user?.emailVerifiedAt,
    kycStatus: profile?.suspendedAt ? 'SUSPENDED' : ((profile?.kycStatus ?? KycStatus.NOT_SUBMITTED) as SellerSnapshot['kycStatus']),
    kycRejectionReason: profile?.kycRejectionReason ?? null,
    termsAccepted: !!accepted,
    nationalSupply: profile?.nationalSupply ?? false,
    zones: { approved: n(zones, CoverageStatus.APPROVED), pending: n(zones, CoverageStatus.PENDING) },
    categories: { approved: n(categories, CoverageStatus.APPROVED), pending: n(categories, CoverageStatus.PENDING) },
    listings: { active: n(listings, ListingStatus.ACTIVE), pendingReview: n(listings, ListingStatus.PENDING_REVIEW), rejected: n(listings, ListingStatus.REJECTED) },
  };
}

export async function getSellerOnboarding(sellerId: string): Promise<Checklist> {
  return buildSellerChecklist(await getSellerSnapshot(sellerId));
}
