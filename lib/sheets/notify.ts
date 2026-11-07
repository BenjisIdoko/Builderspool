import { CoverageStatus, KycStatus, NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// In-app vendor alerts for sheet events. Best effort: a failed alert is logged and
// never blocks the pooling step it describes.
async function send(userIds: string[], type: NotificationType, title: string, body: string, link: string) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, type, title, body, link })) });
  } catch (err) {
    console.error('Sheet notification failed:', type, err);
  }
}

const when = (d: Date) => d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });

/** Vendors who may bid on a sheet: verified, approved for its category, and covering its zone (or national supply). */
export async function eligibleVendorIds(sheet: { category: string; zoneId: string }): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      disabledAt: null,
      categoryRegistrations: { some: { category: sheet.category, status: CoverageStatus.APPROVED } },
      sellerProfile: { is: { kycStatus: KycStatus.APPROVED, suspendedAt: null } },
      AND: [{ OR: [{ sellerProfile: { is: { nationalSupply: true } } }, { zoneCoverage: { some: { zoneId: sheet.zoneId, status: CoverageStatus.APPROVED } } }] }],
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function notifySheetOpened(sheet: { id: string; category: string; zoneId: string; bidsCloseAt: Date }, zoneName: string) {
  const ids = await eligibleVendorIds(sheet);
  await send(ids, NotificationType.SHEET_OPENED, 'New request for quotation', `${sheet.category} for ${zoneName} is open for bids until ${when(sheet.bidsCloseAt)}.`, `/seller/rfqs/${sheet.id}`);
}

export async function notifySheetOffered(sellerId: string, sheet: { id: string; category: string }, rank: number, expiresAt: Date) {
  await send([sellerId], NotificationType.SHEET_OFFERED, `You are rank ${rank}: accept the sheet`, `${sheet.category} is offered to you. Accept by ${when(expiresAt)} or it passes to the next vendor.`, `/seller/rfqs/${sheet.id}`);
}

export async function notifySheetNotAwarded(sellerIds: string[], sheet: { id: string; category: string }, reason: 'AWARDED_ELSEWHERE' | 'CANCELLED') {
  await send(
    sellerIds,
    NotificationType.BID_LOST,
    'Sheet not awarded to you',
    reason === 'AWARDED_ELSEWHERE' ? `The ${sheet.category} sheet went to another vendor.` : `The ${sheet.category} sheet was cancelled because no vendor accepted it.`,
    `/seller/rfqs/${sheet.id}`,
  );
}
