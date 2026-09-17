import { prisma } from '../prisma';
import { NotificationType } from '@prisma/client';
import { isSellerEligible } from '../bidding/scoring';
import type { BidCycle } from '@prisma/client';

async function createNotification(userId: string, type: NotificationType, title: string, body: string, link?: string) {
  return prisma.notification.create({ data: { userId, type, title, body, link } });
}

async function eligibleSellerUserIds(cycle: BidCycle) {
  const profiles = await prisma.sellerProfile.findMany();
  return profiles.filter((p) => isSellerEligible(p, cycle)).map((p) => p.userId);
}

/** Fires once, the moment a brand-new demand cycle is created (not on every order item that joins an existing one). */
export async function notifyCycleOpened(cycle: BidCycle, materialName: string) {
  const userIds = await eligibleSellerUserIds(cycle);
  const regionLabel = cycle.region ?? 'National';
  await Promise.all(
    userIds.map((userId) =>
      createNotification(
        userId,
        NotificationType.CYCLE_OPENED,
        'New demand pool open',
        `${materialName} — ${regionLabel} pool is open for bids.`,
        '/seller'
      )
    )
  );
}

/** Fires from the daily closing-soon cron for every still-open, eligible cycle. */
export async function notifyCycleClosingSoon(cycle: BidCycle, materialName: string) {
  const userIds = await eligibleSellerUserIds(cycle);
  const regionLabel = cycle.region ?? 'National';
  await Promise.all(
    userIds.map((userId) =>
      createNotification(
        userId,
        NotificationType.CYCLE_CLOSING_SOON,
        'Demand pool closing soon',
        `${materialName} — ${regionLabel} pool closes within the hour.`,
        '/seller'
      )
    )
  );
}

export async function notifyBidWon(sellerId: string, materialName: string, quantityFilled: number, unit: string) {
  await createNotification(
    sellerId,
    NotificationType.BID_WON,
    'Bid awarded',
    `You were awarded ${quantityFilled} ${unit} of ${materialName}.`,
    '/seller/allocations'
  );
}

export async function notifyBidLost(sellerId: string, materialName: string) {
  await createNotification(
    sellerId,
    NotificationType.BID_LOST,
    'Bid not awarded',
    `Your bid for ${materialName} wasn't selected this cycle.`,
    '/seller/bids'
  );
}

export async function getNotificationsForSeller(sellerId: string, limit = 12) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: sellerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: sellerId, read: false } }),
  ]);
  return { notifications, unreadCount };
}

export async function markNotificationRead(id: string, sellerId: string) {
  // Scoped to sellerId too — a notification id alone shouldn't let one
  // seller mark another's as read.
  await prisma.notification.updateMany({ where: { id, userId: sellerId }, data: { read: true } });
}

export async function markAllNotificationsRead(sellerId: string) {
  await prisma.notification.updateMany({ where: { userId: sellerId, read: false }, data: { read: true } });
}
