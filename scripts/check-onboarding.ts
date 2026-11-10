// Checks for the onboarding helpers. Pure states first (no database), then a read-only look at
// the real data. Run with: npm run check:onboarding
import { buildSellerChecklist, getSellerSnapshot, type SellerSnapshot } from '../lib/onboarding/seller';
import { buildGoLiveChecklist, getGoLiveSnapshot, type GoLiveSnapshot } from '../lib/onboarding/goLive';

let failures = 0;
const ok = (label: string, cond: boolean, detail?: unknown) => {
  if (!cond) failures++;
  console.log((cond ? 'ok    ' : 'FAIL  ') + label + (cond ? '' : '  -> ' + JSON.stringify(detail)));
};

// ---------- seller ----------
const fresh: SellerSnapshot = {
  emailVerified: false, kycStatus: 'NOT_SUBMITTED', kycRejectionReason: null, termsAccepted: false, nationalSupply: false,
  zones: { approved: 0, pending: 0 }, categories: { approved: 0, pending: 0 }, listings: { active: 0, pendingReview: 0, rejected: 0 },
};
const ready: SellerSnapshot = { ...fresh, emailVerified: true, kycStatus: 'APPROVED', termsAccepted: true, zones: { approved: 2, pending: 0 }, categories: { approved: 1, pending: 0 }, listings: { active: 3, pendingReview: 0, rejected: 0 } };
const step = (s: SellerSnapshot, id: string) => buildSellerChecklist(s).steps.find((x) => x.id === id)!;

const c0 = buildSellerChecklist(fresh);
ok('seller: a brand-new seller is 0 of 5 with every gate to do', c0.done === 0 && c0.total === 5 && !c0.complete && ['email', 'kyc', 'zones', 'categories', 'listing'].every((id) => step(fresh, id).status === 'todo'), c0);
ok('seller: the final row is "next", not done, until the gates are done', step(fresh, 'ready').status === 'blocked');
ok('seller: KYC not submitted links to the KYC page', step(fresh, 'kyc').href === '/seller/kyc');
ok('seller: KYC pending waits on BuildersPool with no action for the seller', (() => { const k = step({ ...fresh, kycStatus: 'PENDING' }, 'kyc'); return k.status === 'waiting' && k.waitingOn === 'BuildersPool' && !k.href; })());
ok('seller: KYC rejected shows the reason and offers a fix', (() => { const k = step({ ...fresh, kycStatus: 'REJECTED', kycRejectionReason: 'CAC document expired' }, 'kyc'); return k.status === 'problem' && /CAC document expired/.test(k.detail) && k.href === '/seller/kyc'; })());
ok('seller: suspended is a problem with no action', (() => { const k = step({ ...fresh, kycStatus: 'SUSPENDED' }, 'kyc'); return k.status === 'problem' && !k.href; })());
ok('seller: verified but terms not accepted still asks for the terms', (() => { const k = step({ ...fresh, kycStatus: 'APPROVED', termsAccepted: false }, 'kyc'); return k.status === 'todo' && /terms/.test(k.detail); })());
ok('seller: verified and accepted is done', step({ ...fresh, kycStatus: 'APPROVED', termsAccepted: true }, 'kyc').status === 'done');
ok('seller: a pending zone request waits on BuildersPool', (() => { const k = step({ ...fresh, zones: { approved: 0, pending: 2 } }, 'zones'); return k.status === 'waiting' && k.waitingOn === 'BuildersPool' && /2 requests are/.test(k.detail); })());
ok('seller: an approved zone is done, and approved beats pending', step({ ...fresh, zones: { approved: 1, pending: 3 } }, 'zones').status === 'done');
ok('seller: national supply makes the zones step done', step({ ...fresh, nationalSupply: true }, 'zones').status === 'done');
ok('seller: categories behave the same way', step({ ...fresh, categories: { approved: 0, pending: 1 } }, 'categories').status === 'waiting' && step({ ...fresh, categories: { approved: 2, pending: 0 } }, 'categories').status === 'done');
ok('seller: a listing held for review waits on BuildersPool', step({ ...fresh, listings: { active: 0, pendingReview: 1, rejected: 0 } }, 'listing').waitingOn === 'BuildersPool');
ok('seller: a rejected listing with nothing live is a problem that links to listings', (() => { const k = step({ ...fresh, listings: { active: 0, pendingReview: 0, rejected: 1 } }, 'listing'); return k.status === 'problem' && k.href === '/seller/listings'; })());
ok('seller: a live listing beats a rejected one', step({ ...fresh, listings: { active: 1, pendingReview: 0, rejected: 2 } }, 'listing').status === 'done');
ok('seller: the listing step tells an unverified seller it goes live once verified', /once you are verified/.test(step(fresh, 'listing').detail) && !/once you are verified/.test(step({ ...fresh, kycStatus: 'APPROVED' }, 'listing').detail));
const cr = buildSellerChecklist(ready);
ok('seller: everything done is 5 of 5, complete, and the final row is done', cr.done === 5 && cr.complete && step(ready, 'ready').status === 'done', cr);
ok('seller: one missing gate keeps it incomplete', !buildSellerChecklist({ ...ready, emailVerified: false }).complete);

// ---------- ops ----------
const bare: GoLiveSnapshot = {
  zones: { active: 5, activeWithoutFee: 5 }, localitiesWithoutZone: 11, waiting: { kyc: 0, zoneRequests: 0, categoryRequests: 0, listingReviews: 0 },
  vendorsReady: 0, liveListings: 0, clockAgeSeconds: 20, pickerOn: false, payoutsOn: false, sheetsOn: false,
};
const allGreen: GoLiveSnapshot = { ...bare, zones: { active: 5, activeWithoutFee: 0 }, localitiesWithoutZone: 0, vendorsReady: 2, liveListings: 6, pickerOn: true, payoutsOn: true, sheetsOn: true };
const g = (s: GoLiveSnapshot, id: string) => buildGoLiveChecklist(s).steps.find((x) => x.id === id)!;

ok('go-live: a bare setup lists what is missing and is not complete', !buildGoLiveChecklist(bare).complete && g(bare, 'fees').status === 'todo' && g(bare, 'vendors').status === 'todo' && g(bare, 'listings').status === 'todo' && g(bare, 'picker').status === 'todo' && g(bare, 'sheets').status === 'todo');
ok('go-live: the payouts row is information only, so it is not counted', g(bare, 'payouts').status === 'info' && buildGoLiveChecklist(bare).total === buildGoLiveChecklist(bare).steps.length - 1);
ok('go-live: fees: counts the zones without one', /5 active zones have no fee/.test(g(bare, 'fees').detail) && g({ ...bare, zones: { active: 5, activeWithoutFee: 0 } }, 'fees').status === 'done');
ok('go-live: no active zones at all is not "done"', g({ ...bare, zones: { active: 0, activeWithoutFee: 0 } }, 'fees').status === 'todo');
ok('go-live: unzoned places are counted in words', /11 places have no zone/.test(g(bare, 'localities').detail) && g({ ...bare, localitiesWithoutZone: 1 }, 'localities').detail.startsWith('1 place has'));
ok('go-live: pending approvals wait on the admin and link to the right queue', (() => {
  const a = g({ ...bare, waiting: { kyc: 0, zoneRequests: 5, categoryRequests: 2, listingReviews: 1 } }, 'approvals');
  return a.status === 'waiting' && a.waitingOn === 'you' && a.href === '/admin/areas' && /5 zone requests, 2 category requests, 1 listing to review/.test(a.detail);
})());
ok('go-live: KYC is the first queue when it has work', g({ ...bare, waiting: { kyc: 1, zoneRequests: 4, categoryRequests: 0, listingReviews: 0 } }, 'approvals').href === '/admin/verification');
ok('go-live: no pending approvals is done', g(bare, 'approvals').status === 'done');
ok('go-live: the clock is done when it ran within 3 minutes, a problem when stale, info when unreadable', g({ ...bare, clockAgeSeconds: 40 }, 'clock').status === 'done' && g({ ...bare, clockAgeSeconds: 600 }, 'clock').status === 'problem' && g({ ...bare, clockAgeSeconds: null }, 'clock').status === 'info');
ok('go-live: a stale clock says how long in plain words', /10 minutes ago/.test(g({ ...bare, clockAgeSeconds: 600 }, 'clock').detail) && /3 hours ago/.test(g({ ...bare, clockAgeSeconds: 3 * 3600 }, 'clock').detail));
const gl = buildGoLiveChecklist(allGreen);
ok('go-live: everything ready and the engine on is complete', gl.complete && gl.done === gl.total, gl);
ok('go-live: payouts off does not stop it being complete', buildGoLiveChecklist({ ...allGreen, payoutsOn: false }).complete);
ok('go-live: ready but the engine still off is not complete', !buildGoLiveChecklist({ ...allGreen, sheetsOn: false }).complete);

// ---------- real data (read-only) ----------
(async () => {
  try {
    const { prisma } = await import('../lib/prisma');
    const snap = await getGoLiveSnapshot();
    const live = buildGoLiveChecklist(snap);
    console.log('\nLIVE go-live readiness: ' + live.done + ' of ' + live.total + ' done');
    for (const s of live.steps) console.log(`   [${s.status.padEnd(7)}] ${s.title}: ${s.detail}`);
    ok('live: the real snapshot builds a checklist without throwing', live.steps.length === 9);

    const dangote = await prisma.user.findUnique({ where: { email: 'sales@dangotematerials.example' }, select: { id: true } });
    if (dangote) {
      const sc = buildSellerChecklist(await getSellerSnapshot(dangote.id));
      console.log('\nLIVE seller checklist (Dangote): ' + sc.done + ' of ' + sc.total + ' done');
      for (const s of sc.steps) console.log(`   [${s.status.padEnd(7)}] ${s.title}: ${s.detail}`);
      ok('live: a real seller builds a checklist without throwing', sc.steps.length === 6);
    }
    await prisma.$disconnect();
  } catch (e) {
    failures++;
    console.error('live check failed:', e);
  }
  console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
