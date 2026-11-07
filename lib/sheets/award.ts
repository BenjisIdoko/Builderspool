import { CoverageStatus, DirectStatus, ListingStatus, SheetAwardStatus, SheetBidStatus, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { getSettings } from '@/lib/settings';
import { completedOrderCounts, scoringParamsFromSettings } from '@/lib/bidding/award';
import { getSheetAccess } from './access';
import { scoreSheetBids, type SheetScoreCandidate, type SheetScoringParams } from './scoring';

const RANKS = 3;
const SHEET_PARAMS = (s: Awaited<ReturnType<typeof getSettings>>): SheetScoringParams => {
  const p = scoringParamsFromSettings(s);
  return {
    weights: {
      PRICE: p.weights.price,
      PERFORMANCE: p.weights.performance,
      CAPACITY: p.weights.capacity,
      DELIVERY: p.weights.delivery,
      GEOGRAPHY: p.weights.geography,
      RESPONSIVENESS: p.weights.responsiveness,
    },
    newSupplierNeutralScore: p.newSupplierNeutralScore,
    newSupplierMinOrders: p.newSupplierMinOrders,
  };
};

const windowEnd = (sheet: { rank1EndsAt: Date; rank2EndsAt: Date; rank3EndsAt: Date }, rank: number) =>
  rank === 1 ? sheet.rank1EndsAt : rank === 2 ? sheet.rank2EndsAt : sheet.rank3EndsAt;

// Moves AWARDING -> CANCELLED. Reverting each line to the seller the buyer picked,
// or refunding it, is the next slice; this only records that no vendor took the sheet.
export async function cancelSheet(sheetId: string, reason: string, now = new Date()): Promise<boolean> {
  const { count } = await prisma.poolSheet.updateMany({ where: { id: sheetId, status: SheetStatus.AWARDING }, data: { status: SheetStatus.CANCELLED, cancelledAt: now, cancelReason: reason } });
  if (count === 0) return false;
  await recordAudit({ actor: null, action: 'sheet.cancelled', entityType: 'PoolSheet', entityId: sheetId, summary: `Sheet cancelled: ${reason}`, metadata: { reason } });
  return true;
}

/**
 * Scores every ELIGIBLE bid on the sheet together (price and delivery are relative
 * to the other bids, so they are scored as one batch) and stores each criterion's
 * points and reason. A sheet whose bids are already scored is left alone.
 */
export async function scoreSheet(sheetId: string, now = new Date()): Promise<number> {
  const sheet = await prisma.poolSheet.findUniqueOrThrow({
    where: { id: sheetId },
    include: {
      lines: { select: { materialId: true, totalQuantity: true } },
      bids: { where: { status: SheetBidStatus.ELIGIBLE, scoredAt: null }, include: { seller: { select: { sellerProfile: { select: { trustScore: true, nationalSupply: true } } } } } },
    },
  });
  if (sheet.bids.length === 0) return 0;

  const sellerIds = sheet.bids.map((b) => b.sellerId);
  const [settings, listings, coverage, completed, direct] = await Promise.all([
    getSettings(),
    prisma.sellerListing.findMany({
      where: { sellerId: { in: sellerIds }, materialId: { in: sheet.lines.map((l) => l.materialId) }, status: ListingStatus.ACTIVE },
      select: { sellerId: true, materialId: true, stockQty: true, leadTimeDays: true },
    }),
    prisma.sellerZoneCoverage.findMany({ where: { sellerId: { in: sellerIds }, zoneId: sheet.zoneId, status: CoverageStatus.APPROVED }, select: { sellerId: true } }),
    completedOrderCounts(sellerIds),
    prisma.directFulfilment.groupBy({ by: ['sellerId'], where: { sellerId: { in: sellerIds }, status: DirectStatus.FULFILLED }, _count: { _all: true } }),
  ]);
  const params = SHEET_PARAMS(settings);
  const zoneCovered = new Set(coverage.map((c) => c.sellerId));
  const directDone = new Map(direct.map((d) => [d.sellerId, d._count._all]));

  const candidates: SheetScoreCandidate[] = sheet.bids.map((b) => {
    const mine = listings.filter((l) => l.sellerId === b.sellerId);
    return {
      bidId: b.id,
      totalAmount: Number(b.totalAmount),
      submittedAt: b.submittedAt,
      completedOrders: (completed.get(b.sellerId) ?? 0) + (directDone.get(b.sellerId) ?? 0),
      trustScore: b.seller.sellerProfile?.trustScore ?? 50,
      stockCover: sheet.lines.map((l) => ({ stock: mine.find((m) => m.materialId === l.materialId)?.stockQty ?? 0, needed: l.totalQuantity })),
      leadTimeDays: mine.length ? Math.max(...mine.map((m) => m.leadTimeDays)) : null,
      geography: zoneCovered.has(b.sellerId) ? 'ZONE' : 'NATIONAL',
    };
  });

  const scored = scoreSheetBids(candidates, params, { opensAt: sheet.frozenAt ?? sheet.poolClosesAt, closesAt: sheet.bidsCloseAt });
  let written = 0;
  for (const s of scored) {
    const { count } = await prisma.sheetBid.updateMany({ where: { id: s.candidate.bidId, scoredAt: null }, data: { totalScore: s.total, scoredAt: now } });
    if (count === 0) continue; // another run scored it first
    await prisma.sheetBidScore.createMany({
      data: s.rows.map((r) => ({ bidId: s.candidate.bidId, criterion: r.criterion, weight: r.weight, points: r.points, reason: r.reason })),
      skipDuplicates: true,
    });
    written++;
  }
  await recordAudit({
    actor: null,
    action: 'sheet.scored',
    entityType: 'PoolSheet',
    entityId: sheetId,
    summary: `Scored ${written} eligible bid(s) on ${sheet.category} sheet`,
    metadata: { ranking: scored.map((s) => ({ bidId: s.candidate.bidId, total: s.total })) },
  });
  return written;
}

// Eligible bids, best first, using the stored scores and the same tie-breaks.
async function rankedBids(sheetId: string) {
  const bids = await prisma.sheetBid.findMany({ where: { sheetId, status: SheetBidStatus.ELIGIBLE, scoredAt: { not: null } }, include: { scores: true } });
  const perf = (b: (typeof bids)[number]) => Number(b.scores.find((s) => s.criterion === 'PERFORMANCE')?.points ?? 0);
  return bids.sort(
    (a, b) =>
      Number(b.totalScore) - Number(a.totalScore) ||
      Number(a.totalAmount) - Number(b.totalAmount) ||
      perf(b) - perf(a) ||
      a.submittedAt.getTime() - b.submittedAt.getTime() ||
      a.id.localeCompare(b.id),
  );
}

/**
 * Bids have closed: score, rank, and offer the sheet to rank 1. Ranks 2 and 3 wait.
 * Too few eligible bids cancels the sheet. Safe to run twice: scores are written
 * once and a sheet that already has awards is not re-ranked.
 */
export async function startAwarding(sheetId: string, now = new Date()): Promise<{ cancelled: boolean; offered: number } | null> {
  const sheet = await prisma.poolSheet.findUnique({ where: { id: sheetId }, include: { awards: { select: { id: true } } } });
  if (!sheet || sheet.status !== SheetStatus.AWARDING || sheet.awards.length > 0) return null;

  await scoreSheet(sheetId, now);
  const ranked = await rankedBids(sheetId);
  const minEligible = Number((await getSettings())['pool.minEligibleBidsPerLine']);
  if (ranked.length === 0 || ranked.length < minEligible) {
    return { cancelled: await cancelSheet(sheetId, ranked.length === 0 ? 'NO_ELIGIBLE_BIDS' : 'BELOW_MIN_BIDS', now), offered: 0 };
  }

  const top = ranked.slice(0, RANKS);
  const { count } = await prisma.sheetAward.createMany({
    data: top.map((b, i) => ({
      sheetId,
      bidId: b.id,
      rank: i + 1,
      status: i === 0 ? SheetAwardStatus.OFFERED : SheetAwardStatus.WAITING,
      offeredAt: i === 0 ? now : null,
      expiresAt: i === 0 ? windowEnd(sheet, 1) : null,
    })),
    skipDuplicates: true,
  });
  if (count > 0) {
    await recordAudit({
      actor: null,
      action: 'sheet.award_offered',
      entityType: 'PoolSheet',
      entityId: sheetId,
      summary: `Offered ${sheet.category} sheet to rank 1 of ${top.length} ranked bid(s)`,
      metadata: { ranks: top.map((b, i) => ({ rank: i + 1, bidId: b.id, sellerId: b.sellerId, score: Number(b.totalScore) })) },
    });
  }
  return { cancelled: false, offered: count > 0 ? 1 : 0 };
}

/**
 * After a rank declines or runs out of time: offer the next waiting rank at once,
 * ending at that rank's fixed time, or cancel the sheet if none is left. Does
 * nothing while an offer is open or once a vendor has accepted.
 */
export async function offerNextRank(sheetId: string, now = new Date()): Promise<'offered' | 'cancelled' | 'none'> {
  const sheet = await prisma.poolSheet.findUnique({ where: { id: sheetId }, include: { awards: { orderBy: { rank: 'asc' } } } });
  if (!sheet || sheet.status !== SheetStatus.AWARDING) return 'none';
  if (sheet.awards.some((a) => a.status === SheetAwardStatus.OFFERED || a.status === SheetAwardStatus.ACCEPTED)) return 'none';

  const next = sheet.awards.find((a) => a.status === SheetAwardStatus.WAITING);
  if (!next) return (await cancelSheet(sheetId, 'NO_VENDOR_ACCEPTED', now)) ? 'cancelled' : 'none';

  const { count } = await prisma.sheetAward.updateMany({
    where: { id: next.id, status: SheetAwardStatus.WAITING },
    data: { status: SheetAwardStatus.OFFERED, offeredAt: now, expiresAt: windowEnd(sheet, next.rank) },
  });
  if (count === 0) return 'none';
  await recordAudit({ actor: null, action: 'sheet.award_offered', entityType: 'SheetAward', entityId: next.id, summary: `Offered ${sheet.category} sheet to rank ${next.rank}`, metadata: { sheetId, rank: next.rank } });
  return 'offered';
}

export type RespondResult = { ok: true } | { ok: false; error: string };

export async function acceptSheetAward(input: { awardId: string; sellerId: string; actorId: string; now?: Date }): Promise<RespondResult> {
  const now = input.now ?? new Date();
  const award = await prisma.sheetAward.findUnique({ where: { id: input.awardId }, include: { bid: true, sheet: true } });
  if (!award || award.bid.sellerId !== input.sellerId) return { ok: false, error: 'That offer was not found.' };
  if (award.status !== SheetAwardStatus.OFFERED || !award.expiresAt || award.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: 'This offer is no longer open.' };
  }
  const access = await getSheetAccess(input.sellerId, award.sheet);
  if (!access.ok) return { ok: false, error: access.message };

  const won = await prisma.$transaction(async (tx) => {
    const taken = await tx.sheetAward.updateMany({ where: { id: award.id, status: SheetAwardStatus.OFFERED, expiresAt: { gt: now } }, data: { status: SheetAwardStatus.ACCEPTED, respondedAt: now } });
    if (taken.count === 0) return false;
    await tx.poolSheet.updateMany({ where: { id: award.sheetId, status: SheetStatus.AWARDING }, data: { status: SheetStatus.AWARDED, awardedAt: now } });
    await tx.sheetAward.updateMany({ where: { sheetId: award.sheetId, status: SheetAwardStatus.WAITING }, data: { status: SheetAwardStatus.EXPIRED, declineReason: 'Sheet awarded to a higher rank' } });
    return true;
  });
  if (!won) return { ok: false, error: 'This offer is no longer open.' };
  await recordAudit({
    actor: { id: input.actorId, role: 'SELLER' },
    action: 'sheet.award_accepted',
    entityType: 'SheetAward',
    entityId: award.id,
    summary: `Accepted ${award.sheet.category} sheet as rank ${award.rank}`,
    metadata: { sheetId: award.sheetId, bidId: award.bidId, rank: award.rank },
  });
  return { ok: true };
}

export async function declineSheetAward(input: { awardId: string; sellerId: string; actorId: string; reason?: string; now?: Date }): Promise<RespondResult> {
  const now = input.now ?? new Date();
  const award = await prisma.sheetAward.findUnique({ where: { id: input.awardId }, include: { bid: true, sheet: true } });
  if (!award || award.bid.sellerId !== input.sellerId) return { ok: false, error: 'That offer was not found.' };

  const { count } = await prisma.sheetAward.updateMany({
    where: { id: award.id, status: SheetAwardStatus.OFFERED, expiresAt: { gt: now } },
    data: { status: SheetAwardStatus.DECLINED, respondedAt: now, declineReason: input.reason?.trim().slice(0, 300) || null },
  });
  if (count === 0) return { ok: false, error: 'This offer is no longer open.' };
  await recordAudit({
    actor: { id: input.actorId, role: 'SELLER' },
    action: 'sheet.award_declined',
    entityType: 'SheetAward',
    entityId: award.id,
    summary: `Declined ${award.sheet.category} sheet as rank ${award.rank}`,
    metadata: { sheetId: award.sheetId, rank: award.rank, reason: input.reason ?? null },
  });
  await offerNextRank(award.sheetId, now);
  return { ok: true };
}

export interface AwardTickReport {
  expired: string[];
  started: string[];
}

/**
 * Time-driven steps: an offer whose window has ended becomes EXPIRED and the next
 * rank is offered (or the sheet is cancelled); an AWARDING sheet that has no awards
 * yet (a close that stopped midway) is picked up and started. Each is a
 * compare-and-swap, so overlapping runs do nothing twice.
 */
export async function advanceAwards(now = new Date()): Promise<AwardTickReport> {
  const report: AwardTickReport = { expired: [], started: [] };

  for (let pass = 0; pass < RANKS; pass++) {
    const overdue = await prisma.sheetAward.findMany({ where: { status: SheetAwardStatus.OFFERED, expiresAt: { lte: now } }, select: { id: true, sheetId: true, rank: true, sheet: { select: { category: true } } } });
    if (overdue.length === 0) break;
    for (const a of overdue) {
      const { count } = await prisma.sheetAward.updateMany({ where: { id: a.id, status: SheetAwardStatus.OFFERED }, data: { status: SheetAwardStatus.EXPIRED } });
      if (count === 0) continue;
      report.expired.push(a.id);
      await recordAudit({ actor: null, action: 'sheet.award_expired', entityType: 'SheetAward', entityId: a.id, summary: `Rank ${a.rank} offer on ${a.sheet.category} sheet ran out of time`, metadata: { sheetId: a.sheetId, rank: a.rank } });
      await offerNextRank(a.sheetId, now);
    }
  }

  const stuck = await prisma.poolSheet.findMany({ where: { status: SheetStatus.AWARDING, awards: { none: {} } }, select: { id: true }, take: 50 });
  for (const { id } of stuck) if (await startAwarding(id, now)) report.started.push(id);

  // An AWARDING sheet with awards but nothing open (a decline that stopped midway).
  const idle = await prisma.poolSheet.findMany({ where: { status: SheetStatus.AWARDING, awards: { some: {}, none: { status: { in: [SheetAwardStatus.OFFERED, SheetAwardStatus.ACCEPTED] } } } }, select: { id: true }, take: 50 });
  for (const { id } of idle) await offerNextRank(id, now);

  return report;
}
