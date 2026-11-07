import { Prisma, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { getSheetAccess } from './access';

export type SubmitSheetBidResult = { ok: true; bidId: string; totalAmount: number } | { ok: false; error: string };

const kobo = (naira: number) => Math.round(naira * 100);

/**
 * A vendor's one submission on a sheet: a price on every line. Access rules
 * (verified, registered for the category, covering the zone) and the clock are
 * enforced here. A price above a line's reference is accepted but will make the
 * whole bid ineligible when bids close, so the screen warns before it is sent.
 * One submission per vendor, enforced by the database, so a double click or a
 * retry cannot create a second.
 */
export async function submitSheetBid(input: {
  sellerId: string;
  actorId: string;
  sheetId: string;
  prices: Record<string, number>; // sheet line id -> unit price in naira
  now?: Date;
}): Promise<SubmitSheetBidResult> {
  const now = input.now ?? new Date();
  const sheet = await prisma.poolSheet.findUnique({ where: { id: input.sheetId }, include: { lines: true } });
  if (!sheet) return { ok: false, error: 'That sheet no longer exists.' };
  if (sheet.status === SheetStatus.OPEN) return { ok: false, error: 'Bidding opens when the pool closes.' };
  if (sheet.status !== SheetStatus.BIDDING || now.getTime() >= sheet.bidsCloseAt.getTime()) {
    return { ok: false, error: 'This sheet is no longer accepting bids.' };
  }

  const access = await getSheetAccess(input.sellerId, sheet);
  if (!access.ok) return { ok: false, error: access.message };

  const already = await prisma.sheetBid.findUnique({ where: { sheetId_sellerId: { sheetId: sheet.id, sellerId: input.sellerId } }, select: { id: true } });
  if (already) return { ok: false, error: 'You have already submitted a bid on this sheet.' };

  const lines = [];
  let totalKobo = 0;
  for (const line of sheet.lines) {
    const price = input.prices[line.id];
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      return { ok: false, error: 'Enter a price for every item. A bid must cover the whole sheet.' };
    }
    if (kobo(price) !== Math.round(price * 100) || price > 1_000_000_000) return { ok: false, error: 'One of the prices is not a valid amount.' };
    lines.push({ lineId: line.id, unitPrice: price });
    totalKobo += kobo(price) * line.totalQuantity;
  }
  const extra = Object.keys(input.prices).filter((id) => !sheet.lines.some((l) => l.id === id));
  if (extra.length > 0) return { ok: false, error: 'That bid does not match this sheet. Reload and try again.' };
  if (lines.length === 0) return { ok: false, error: 'This sheet has no items to bid on.' };

  try {
    const bid = await prisma.sheetBid.create({
      data: { sheetId: sheet.id, sellerId: input.sellerId, totalAmount: totalKobo / 100, lines: { create: lines } },
    });
    await recordAudit({
      actor: { id: input.actorId, role: 'SELLER' },
      action: 'sheet.bid_submitted',
      entityType: 'SheetBid',
      entityId: bid.id,
      summary: `Bid on ${sheet.category} sheet: ${lines.length} line(s), total ${totalKobo / 100}`,
      metadata: { sheetId: sheet.id, sellerId: input.sellerId },
    });
    return { ok: true, bidId: bid.id, totalAmount: totalKobo / 100 };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'You have already submitted a bid on this sheet.' };
    }
    throw err;
  }
}
