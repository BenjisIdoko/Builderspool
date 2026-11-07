import { SheetBidStatus, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { getSheetAccess } from './access';

export type BidDecision = {
  bidId: string;
  sellerId: string;
  status: 'ELIGIBLE' | 'INELIGIBLE';
  reason: string | null;
};

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

/**
 * Bids close: marks every submitted bid ELIGIBLE or INELIGIBLE, with the reason.
 * A bid is ineligible if any line is above its reference price (the whole sheet
 * goes with it), or if the vendor is no longer verified, registered or covering
 * the zone. Only touches bids still SUBMITTED, so running it twice changes nothing.
 */
export async function evaluateSheetBids(sheetId: string): Promise<BidDecision[]> {
  const sheet = await prisma.poolSheet.findUniqueOrThrow({
    where: { id: sheetId },
    include: {
      lines: { include: { material: { select: { name: true, unit: true } } } },
      bids: { where: { status: SheetBidStatus.SUBMITTED }, include: { lines: true } },
    },
  });
  const lineById = new Map(sheet.lines.map((l) => [l.id, l]));
  const decisions: BidDecision[] = [];

  for (const bid of sheet.bids) {
    let reason: string | null = null;

    const access = await getSheetAccess(bid.sellerId, sheet);
    if (!access.ok) reason = `${access.code}: ${access.message}`;

    if (!reason) {
      for (const bl of bid.lines) {
        const line = lineById.get(bl.lineId);
        const ref = line?.referencePrice == null ? null : Number(line.referencePrice);
        if (line && ref !== null && Number(bl.unitPrice) > ref) {
          reason = `ABOVE_REFERENCE: ${line.material.name} bid at ${naira(Number(bl.unitPrice))}, above the ${naira(ref)} reference`;
          break;
        }
      }
    }
    if (!reason && bid.lines.length !== sheet.lines.length) reason = 'INCOMPLETE: the bid does not price every item on the sheet';

    const status = reason ? SheetBidStatus.INELIGIBLE : SheetBidStatus.ELIGIBLE;
    const { count } = await prisma.sheetBid.updateMany({
      where: { id: bid.id, status: SheetBidStatus.SUBMITTED },
      data: { status, ineligibleReason: reason },
    });
    if (count > 0) decisions.push({ bidId: bid.id, sellerId: bid.sellerId, status, reason });
  }
  return decisions;
}

/**
 * Bids close: BIDDING -> AWARDING. Bids are checked first (idempotent), then one
 * compare-and-swap decides who moves the sheet on and writes the audit entry.
 * The award itself is the next slice; until it exists a sheet waits in AWARDING.
 */
export async function closeSheetBidding(sheetId: string): Promise<{ decisions: BidDecision[] } | null> {
  const decisions = await evaluateSheetBids(sheetId);
  const { count } = await prisma.poolSheet.updateMany({ where: { id: sheetId, status: SheetStatus.BIDDING }, data: { status: SheetStatus.AWARDING } });
  if (count === 0) return null;

  const sheet = await prisma.poolSheet.findUniqueOrThrow({ where: { id: sheetId }, select: { category: true, bids: { select: { status: true } } } });
  const eligible = sheet.bids.filter((b) => b.status === SheetBidStatus.ELIGIBLE).length;
  await recordAudit({
    actor: null,
    action: 'sheet.bids_closed',
    entityType: 'PoolSheet',
    entityId: sheetId,
    summary: `Bids closed on ${sheet.category} sheet: ${sheet.bids.length} submitted, ${eligible} eligible`,
    metadata: { decisions },
  });
  return { decisions };
}
