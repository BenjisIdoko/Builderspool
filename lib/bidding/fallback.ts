import { prisma } from '../prisma';
import { AllocationStatus, BidStatus, type Allocation } from '@prisma/client';
import { getSettings } from '../settings';
import { refundDueKobo } from './refund';
import { postLedgerEntry } from '../ledger';
import { notifyAwardLapsed, notifyBidWon } from '../notifications';
import { allocateDemand } from './allocate';

// What happens to an award a supplier doesn't take (Transfer File 5.4):
//   - the supplier declines, or doesn't accept by the accept deadline, or is
//     suspended while the award is waiting -> the quantity passes ONCE to the
//     next-ranked eligible bids, who get until the fallback time to accept;
//   - an award that passed once and still isn't accepted is final: it isn't
//     passed again;
//   - when the fallback time arrives, whatever no supplier accepted is marked
//     unsuccessful for the buyer, who is not charged for it (a refund due is
//     recorded). Nothing is ever bought from a supplier the buyer didn't
//     authorise, and no winning bid is invented.

export type ReleaseReason = 'DECLINED' | 'EXPIRED' | 'SELLER_SUSPENDED';

const BID_REASON: Record<ReleaseReason, string> = {
  DECLINED: 'AWARD_DECLINED',
  EXPIRED: 'AWARD_EXPIRED',
  SELLER_SUSPENDED: 'SELLER_SUSPENDED',
};

export interface ReleaseResult {
  released: boolean; // false when it was no longer waiting (already accepted, expired or cancelled)
  reassigned: Allocation[];
  unplaced: number; // units nobody picked up (final round, past fallback, or no capacity left)
}

/**
 * Takes a still-waiting award back from its supplier and passes the quantity to
 * the next-ranked bids. The first step is a compare-and-swap on the allocation
 * status, so a decline, a timeout and a suspension arriving together release it
 * only once.
 */
export async function releaseAllocation(allocationId: string, reason: ReleaseReason, now = new Date()): Promise<ReleaseResult> {
  const { count } = await prisma.allocation.updateMany({
    where: { id: allocationId, status: AllocationStatus.PENDING },
    data: {
      status: AllocationStatus.CANCELLED,
      cancelReason: reason,
      declinedAt: reason === 'DECLINED' ? now : undefined,
    },
  });
  if (count === 0) return { released: false, reassigned: [], unplaced: 0 };

  const settings = await getSettings();
  const maxWinners = Number(settings['pool.maxWinnersPerCategoryZone']);

  const outcome = await prisma.$transaction(async (tx) => {
    const failed = await tx.allocation.findUniqueOrThrow({
      where: { id: allocationId },
      include: { bid: { include: { cycle: { include: { material: { select: { name: true, unit: true, category: true } } } } } } },
    });
    const cycle = failed.bid.cycle;

    // The released bid goes back to what its remaining awards say it is.
    const stillHeld = await tx.allocation.aggregate({
      where: { bidId: failed.bidId, status: { not: AllocationStatus.CANCELLED } },
      _sum: { quantityFilled: true },
    });
    const held = stillHeld._sum.quantityFilled ?? 0;
    await tx.bid.update({
      where: { id: failed.bidId },
      data: held === 0
        ? { status: BidStatus.REJECTED, rejectionReason: BID_REASON[reason] }
        : { status: BidStatus.PARTIALLY_FILLED },
    });

    const passesAllowed = failed.cascadeRound < 1 && !(cycle.fallbackAt && now >= cycle.fallbackAt);
    if (!passesAllowed) return { failed, cycle, created: [] as Allocation[], unplaced: failed.quantityFilled };

    // Suppliers who already turned down (or sat on) an award in this cycle are
    // not offered another.
    const turnedDown = await tx.allocation.findMany({
      where: { bid: { cycleId: cycle.id }, status: AllocationStatus.CANCELLED, cancelReason: { in: ['DECLINED', 'EXPIRED', 'SELLER_SUSPENDED'] } },
      select: { bid: { select: { sellerId: true } } },
    });
    const excludedSellers = new Set(turnedDown.map((a) => a.bid.sellerId));

    // Sellers currently holding a (non-cancelled) award in this category and
    // zone count toward the cap on winning suppliers.
    const holders = await tx.allocation.findMany({
      where: {
        status: { not: AllocationStatus.CANCELLED },
        bid: { cycle: { date: cycle.date, region: cycle.region, material: { category: cycle.material.category } } },
      },
      select: { bid: { select: { sellerId: true } } },
    });

    const candidates = await tx.bid.findMany({
      where: {
        cycleId: cycle.id,
        rank: { not: null },
        status: { in: [BidStatus.REJECTED, BidStatus.PARTIALLY_FILLED] },
        OR: [{ rejectionReason: null }, { rejectionReason: 'OVER_WINNER_CAP' }],
        seller: { sellerProfile: { is: { kycStatus: 'APPROVED' } } },
      },
      orderBy: { rank: 'asc' },
      include: { allocations: { where: { status: { not: AllocationStatus.CANCELLED } }, select: { quantityFilled: true } } },
    });

    const slots = candidates
      .filter((b) => !excludedSellers.has(b.sellerId))
      .map((b) => ({
        bidId: b.id,
        sellerId: b.sellerId,
        capacity: b.quantityOffered - b.allocations.reduce((sum, a) => sum + a.quantityFilled, 0),
      }))
      .filter((s) => s.capacity > 0);

    const plan = allocateDemand([{ id: failed.orderItemId, quantity: failed.quantityFilled }], slots, {
      maxWinners,
      existingWinners: holders.map((h) => h.bid.sellerId),
    });

    const created: Allocation[] = [];
    for (const a of plan.allocations) {
      created.push(
        await tx.allocation.create({
          data: {
            bidId: a.bidId,
            orderItemId: a.orderItemId,
            quantityFilled: a.quantity,
            status: AllocationStatus.PENDING,
            acceptDeadlineAt: cycle.fallbackAt,
            cascadeRound: failed.cascadeRound + 1,
          },
        }),
      );
    }
    for (const [bidId, filled] of plan.filledByBid) {
      const bid = candidates.find((b) => b.id === bidId)!;
      const alreadyHeld = bid.allocations.reduce((sum, x) => sum + x.quantityFilled, 0);
      await tx.bid.update({
        where: { id: bidId },
        data: {
          status: alreadyHeld + filled >= bid.quantityOffered ? BidStatus.FILLED : BidStatus.PARTIALLY_FILLED,
          rejectionReason: null,
        },
      });
    }

    return { failed, cycle, created, unplaced: plan.unfilledByItem.get(failed.orderItemId) ?? 0 };
  }, { timeout: 20_000, maxWait: 10_000 });

  // Told only after the transaction has committed.
  const material = outcome.cycle.material;
  await notifyAwardLapsed(outcome.failed.bid.sellerId, material.name, outcome.failed.quantityFilled, material.unit, reason);
  if (outcome.created.length > 0) {
    const bySeller = new Map<string, number>();
    const bids = await prisma.bid.findMany({ where: { id: { in: outcome.created.map((a) => a.bidId) } }, select: { id: true, sellerId: true } });
    const sellerOfBid = new Map(bids.map((b) => [b.id, b.sellerId]));
    for (const a of outcome.created) {
      const sellerId = sellerOfBid.get(a.bidId)!;
      bySeller.set(sellerId, (bySeller.get(sellerId) ?? 0) + a.quantityFilled);
    }
    await Promise.all(
      [...bySeller].map(([sellerId, qty]) => notifyBidWon(sellerId, material.name, qty, material.unit, outcome.cycle.fallbackAt)),
    );
  }
  if (outcome.unplaced > 0) {
    console.warn(
      `[bidding] ${outcome.unplaced} of ${outcome.failed.quantityFilled} units from allocation ${allocationId} could not be passed on — the fallback step will mark them unsuccessful for the buyer`,
    );
  }

  return { released: true, reassigned: outcome.created, unplaced: outcome.unplaced };
}

/** Releases every award of this seller that is still waiting for acceptance. */
export async function releasePendingAllocationsForSeller(sellerId: string, reason: ReleaseReason, now = new Date()): Promise<number> {
  const pending = await prisma.allocation.findMany({
    where: { status: AllocationStatus.PENDING, bid: { sellerId } },
    select: { id: true },
  });
  let released = 0;
  for (const { id } of pending) if ((await releaseAllocation(id, reason, now)).released) released += 1;
  return released;
}

/** Expires every waiting award whose accept deadline has passed. */
export async function expireOverdueAllocations(now = new Date()): Promise<number> {
  const overdue = await prisma.allocation.findMany({
    where: { status: AllocationStatus.PENDING, acceptDeadlineAt: { lte: now } },
    select: { id: true },
    orderBy: { cascadeRound: 'asc' },
  });
  let expired = 0;
  for (const { id } of overdue) if ((await releaseAllocation(id, 'EXPIRED', now)).released) expired += 1;
  return expired;
}

export interface FallbackReport {
  cycleId: string;
  unsuccessfulLines: number;
  unfilledUnits: number;
}

/**
 * The fallback step: for a cycle whose fallback time has passed, any units no
 * supplier accepted are recorded as unfilled on the order line and a refund due
 * is posted for them (goods at the locked price, plus the line's delivery
 * charge in proportion). Compare-and-swap on fallbackProcessedAt, so it runs
 * once per cycle.
 */
export async function finalizeCycleFallback(cycleId: string, now = new Date()): Promise<FallbackReport | null> {
  const { count } = await prisma.bidCycle.updateMany({
    where: { id: cycleId, fallbackProcessedAt: null, fallbackAt: { lte: now } },
    data: { fallbackProcessedAt: now },
  });
  if (count === 0) return null;

  const items = await prisma.orderItem.findMany({
    where: { bidCycleId: cycleId },
    include: {
      order: { select: { id: true, buyerId: true } },
      allocations: { where: { status: { not: AllocationStatus.CANCELLED } }, select: { quantityFilled: true } },
    },
  });

  let unsuccessfulLines = 0;
  let unfilledUnits = 0;
  for (const item of items) {
    const covered = item.allocations.reduce((sum, a) => sum + a.quantityFilled, 0);
    const unfilled = Math.max(0, item.quantity - covered);
    if (unfilled === 0) continue;

    await prisma.orderItem.update({ where: { id: item.id }, data: { unfilledQuantity: unfilled } });
    await postLedgerEntry({
      account: 'BUYER_REFUND_DUE',
      amountKobo: refundDueKobo(item, unfilled),
      entryKey: `refund-due:${item.id}`,
      memo: `No winning supplier for ${unfilled} of ${item.quantity} units — not charged`,
      orderId: item.order.id,
      orderItemId: item.id,
      userId: item.order.buyerId,
    });
    unsuccessfulLines += 1;
    unfilledUnits += unfilled;
  }

  return { cycleId, unsuccessfulLines, unfilledUnits };
}
