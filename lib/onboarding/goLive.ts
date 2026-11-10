import { CoverageStatus, KycStatus, ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { summarise, type Checklist, type ChecklistStep } from './types';

// "Go-live readiness": what must be true before the sheet engine takes real orders, from
// live data. The builder is pure so every state can be tested on plain data.
export interface GoLiveSnapshot {
  zones: { active: number; activeWithoutFee: number };
  localitiesWithoutZone: number;
  waiting: { kyc: number; zoneRequests: number; categoryRequests: number; listingReviews: number };
  /** Sellers who are verified, not suspended, approved for a category AND for a zone (or national supply). */
  vendorsReady: number;
  liveListings: number;
  /** Seconds since the per-minute clock last ran successfully; null if it could not be read. */
  clockAgeSeconds: number | null;
  pickerOn: boolean;
  payoutsOn: boolean;
  sheetsOn: boolean;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function buildGoLiveChecklist(s: GoLiveSnapshot): Checklist {
  const steps: ChecklistStep[] = [];

  steps.push(
    s.zones.active > 0 && s.zones.activeWithoutFee === 0
      ? { id: 'fees', title: 'Every active zone has a delivery fee', status: 'done', detail: `${plural(s.zones.active, 'zone has', 'zones have')} a fee.` }
      : {
          id: 'fees',
          title: 'Every active zone has a delivery fee',
          status: 'todo',
          detail: s.zones.active === 0 ? 'There are no active delivery zones.' : `${plural(s.zones.activeWithoutFee, 'active zone has', 'active zones have')} no fee, so buyers there can only pick up.`,
          href: '/admin/areas',
          cta: 'Set fees',
        },
  );

  steps.push(
    s.localitiesWithoutZone === 0
      ? { id: 'localities', title: 'Every place belongs to a zone', status: 'done', detail: 'All places are assigned.' }
      : {
          id: 'localities',
          title: 'Every place belongs to a zone',
          status: 'todo',
          detail: `${plural(s.localitiesWithoutZone, 'place has', 'places have')} no zone, so buyers there can only pick up. Assign them, or leave them pickup-only on purpose.`,
          href: '/admin/areas',
          cta: 'Assign places',
        },
  );

  const w = s.waiting;
  const waitingTotal = w.kyc + w.zoneRequests + w.categoryRequests + w.listingReviews;
  const parts = [
    w.kyc && plural(w.kyc, 'KYC submission', 'KYC submissions'),
    w.zoneRequests && plural(w.zoneRequests, 'zone request', 'zone requests'),
    w.categoryRequests && plural(w.categoryRequests, 'category request', 'category requests'),
    w.listingReviews && plural(w.listingReviews, 'listing to review', 'listings to review'),
  ].filter(Boolean);
  const queue = w.kyc ? '/admin/verification' : w.zoneRequests ? '/admin/areas' : w.categoryRequests ? '/admin/sheets' : '/admin/listings';
  steps.push(
    waitingTotal === 0
      ? { id: 'approvals', title: 'Nothing is waiting on you', status: 'done', detail: 'No approvals are pending.' }
      : { id: 'approvals', title: 'Vendor approvals are waiting on you', status: 'waiting', waitingOn: 'you', detail: `${parts.join(', ')}.`, href: queue, cta: 'Open the queue' },
  );

  steps.push(
    s.vendorsReady > 0
      ? { id: 'vendors', title: 'A vendor can bid on a sheet', status: 'done', detail: `${plural(s.vendorsReady, 'vendor is', 'vendors are')} verified and approved for a category and a zone.` }
      : { id: 'vendors', title: 'A vendor can bid on a sheet', status: 'todo', detail: 'No vendor is verified and approved for both a category and a zone yet, so no sheet could be bid on.', href: '/admin/sheets', cta: 'Review requests' },
  );

  steps.push(
    s.liveListings > 0
      ? { id: 'listings', title: 'Vendors have live listings', status: 'done', detail: `${plural(s.liveListings, 'listing is', 'listings are')} live. They set each sheet's reference price and enable Buy Direct.` }
      : { id: 'listings', title: 'Vendors have live listings', status: 'todo', detail: 'No listing is live. Listings set the reference price for each sheet and are what Buy Direct sells.', href: '/admin/listings', cta: 'Review listings' },
  );

  if (s.clockAgeSeconds === null) {
    steps.push({ id: 'clock', title: 'The pooling clock is running', status: 'info', detail: 'The schedule could not be read from here. Check it in the database.' });
  } else if (s.clockAgeSeconds <= 180) {
    steps.push({ id: 'clock', title: 'The pooling clock is running', status: 'done', detail: `It last ran ${s.clockAgeSeconds < 90 ? 'a minute ago' : 'about two minutes ago'}.` });
  } else {
    const m = Math.round(s.clockAgeSeconds / 60);
    steps.push({ id: 'clock', title: 'The pooling clock is running', status: 'problem', detail: `It last ran ${m < 120 ? `${m} minutes` : `${Math.round(m / 60)} hours`} ago. Sheets will not move until it runs.` });
  }

  steps.push(
    s.pickerOn
      ? { id: 'picker', title: 'Buyers choose their area at checkout', status: 'done', detail: 'The area picker is on, so orders carry a zone.' }
      : { id: 'picker', title: 'Buyers choose their area at checkout', status: 'todo', detail: 'The area picker is off, so orders have no zone and cannot join a sheet.', href: '/admin/settings', cta: 'Open settings' },
  );

  steps.push(
    s.payoutsOn
      ? { id: 'payouts', title: 'Vendor payouts', status: 'done', detail: 'Payouts are switched on.' }
      : { id: 'payouts', title: 'Vendor payouts', status: 'info', detail: 'Switched off until Paystack is live and reviewed. Goods can be received, but nobody can be paid yet.' },
  );

  steps.push(
    s.sheetsOn
      ? { id: 'sheets', title: 'The sheet engine is on', status: 'done', detail: 'Paid pool orders with a zone join category sheets.' }
      : { id: 'sheets', title: 'The sheet engine is on', status: 'todo', detail: 'Switch it on when the steps above are done. Until then orders use the older per-material pools.', href: '/admin/settings', cta: 'Open settings' },
  );

  return summarise(steps, (all) => all.every((x) => x.status === 'done' || x.status === 'info'));
}

export async function getGoLiveSnapshot(): Promise<GoLiveSnapshot> {
  const [settings, zones, noFee, unzoned, kyc, zoneReq, catReq, listingReq, vendors, live, clock] = await Promise.all([
    getSettings(),
    prisma.deliveryZone.count({ where: { active: true } }),
    prisma.deliveryZone.count({ where: { active: true, deliveryFee: null } }),
    prisma.locality.count({ where: { zoneId: null } }),
    prisma.sellerProfile.count({ where: { kycStatus: KycStatus.PENDING } }),
    prisma.sellerZoneCoverage.count({ where: { status: CoverageStatus.PENDING } }),
    prisma.sellerCategory.count({ where: { status: CoverageStatus.PENDING } }),
    prisma.sellerListing.count({ where: { status: ListingStatus.PENDING_REVIEW } }),
    prisma.user.count({
      where: {
        disabledAt: null,
        sellerProfile: { is: { kycStatus: KycStatus.APPROVED, suspendedAt: null } },
        categoryRegistrations: { some: { status: CoverageStatus.APPROVED } },
        AND: [{ OR: [{ sellerProfile: { is: { nationalSupply: true } } }, { zoneCoverage: { some: { status: CoverageStatus.APPROVED } } }] }],
      },
    }),
    prisma.sellerListing.count({ where: { status: ListingStatus.ACTIVE } }),
    // The per-minute clock is a Supabase pg_cron job; its history is readable when this database role can see it.
    prisma
      .$queryRaw<{ age: number | null }[]>`select extract(epoch from (now() - max(start_time)))::float8 as age from cron.job_run_details where status = 'succeeded'`
      .then((rows) => (rows[0]?.age == null ? null : Math.round(Number(rows[0].age))))
      .catch(() => null),
  ]);

  return {
    zones: { active: zones, activeWithoutFee: noFee },
    localitiesWithoutZone: unzoned,
    waiting: { kyc, zoneRequests: zoneReq, categoryRequests: catReq, listingReviews: listingReq },
    vendorsReady: vendors,
    liveListings: live,
    clockAgeSeconds: clock,
    pickerOn: settings['areas.checkoutPickerEnabled'] === true,
    payoutsOn: settings['money.sellerPayoutsEnabled'] === true,
    sheetsOn: settings['sheets.enabled'] === true,
  };
}

export async function getGoLiveReadiness(): Promise<Checklist> {
  return buildGoLiveChecklist(await getGoLiveSnapshot());
}
