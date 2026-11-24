import { prisma } from '../prisma';
import { NotificationChannel, NotificationDeliveryStatus, NotificationType } from '@prisma/client';
import { isSellerEligible } from '../bidding/scoring';
import type { BidCycle } from '@prisma/client';
import { formatLagosClock, formatNaira } from '@/lib/format';
import { deliverMultiChannel } from './channels';

export interface NotifyOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  dedupeKey?: string;
}

/**
 * Creates an in-app notification and dispatches across Email, SMS, and WhatsApp.
 * When `dedupeKey` is supplied, checks `NotificationDelivery` for `dedupeKey:IN_APP`
 * so automated reminders or repeated triggers never spam the user.
 */
export async function notifyUser(opts: NotifyOptions) {
  const inAppKey = opts.dedupeKey ? `${opts.dedupeKey}:IN_APP` : undefined;
  if (inAppKey) {
    const existing = await prisma.notificationDelivery.findUnique({ where: { dedupeKey: inAppKey } });
    if (existing) return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });

  if (inAppKey) {
    await prisma.notificationDelivery
      .create({
        data: {
          userId: opts.userId,
          notificationId: notification.id,
          channel: NotificationChannel.IN_APP,
          recipient: opts.userId,
          subject: opts.title,
          body: opts.body,
          status: NotificationDeliveryStatus.SENT,
          dedupeKey: inAppKey,
        },
      })
      .catch(() => {});
  }

  await deliverMultiChannel({
    userId: opts.userId,
    notificationId: notification.id,
    title: opts.title,
    body: opts.body,
    link: opts.link,
    dedupeKey: opts.dedupeKey,
  });

  return notification;
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
      notifyUser({
        userId,
        type: NotificationType.CYCLE_OPENED,
        title: 'New demand pool open',
        body: `${materialName} — ${regionLabel} pool is open for bids.`,
        link: '/seller',
        dedupeKey: `cycle-opened:${cycle.id}:${userId}`,
      })
    )
  );
}

/** Fires from the daily closing-soon cron for every still-open, eligible cycle. */
export async function notifyCycleClosingSoon(cycle: BidCycle, materialName: string) {
  const userIds = await eligibleSellerUserIds(cycle);
  const regionLabel = cycle.region ?? 'National';
  await Promise.all(
    userIds.map((userId) =>
      notifyUser({
        userId,
        type: NotificationType.CYCLE_CLOSING_SOON,
        title: 'Demand pool closing soon',
        body: `${materialName} — ${regionLabel} pool closes within the hour.`,
        link: '/seller',
        dedupeKey: `cycle-closing-soon:${cycle.id}:${userId}`,
      })
    )
  );
}

export async function notifyBidWon(
  sellerId: string,
  materialName: string,
  quantityFilled: number,
  unit: string,
  acceptDeadlineAt?: Date | null,
) {
  const by = acceptDeadlineAt
    ? ` Accept it by ${formatLagosClock(acceptDeadlineAt)} or it passes to the next supplier.`
    : '';
  await notifyUser({
    userId: sellerId,
    type: NotificationType.BID_WON,
    title: 'Bid awarded — please accept',
    body: `You were awarded ${quantityFilled} ${unit} of ${materialName}.${by}`,
    link: '/seller/allocations',
  });
}

export async function notifyBidLost(sellerId: string, materialName: string) {
  await notifyUser({
    userId: sellerId,
    type: NotificationType.BID_LOST,
    title: 'Bid not awarded',
    body: `Your bid for ${materialName} wasn't selected this cycle.`,
    link: '/seller/bids',
  });
}

/** An award the seller no longer holds — declined, not accepted in time, or released on suspension. */
export async function notifyAwardLapsed(
  sellerId: string,
  materialName: string,
  quantity: number,
  unit: string,
  reason: 'DECLINED' | 'EXPIRED' | 'SELLER_SUSPENDED',
) {
  const body =
    reason === 'DECLINED'
      ? `You declined ${quantity} ${unit} of ${materialName}; it has been passed to the next supplier.`
      : reason === 'EXPIRED'
        ? `${quantity} ${unit} of ${materialName} wasn't accepted in time and has been passed to the next supplier.`
        : `${quantity} ${unit} of ${materialName} was released because your account is suspended.`;
  await notifyUser({
    userId: sellerId,
    type: NotificationType.BID_LOST,
    title: 'Award passed on',
    body,
    link: '/seller/allocations',
  });
}

export async function notifySellerDirectOrder(
  sellerId: string,
  directId: string,
  materialName: string,
  quantity: number,
  unit: string,
  acceptDeadlineAt: Date,
) {
  await notifyUser({
    userId: sellerId,
    type: NotificationType.DIRECT_ORDER_RECEIVED,
    title: 'New Buy Direct order — please accept',
    body: `A buyer ordered ${quantity} ${unit} of ${materialName}. Accept by ${formatLagosClock(acceptDeadlineAt)} to supply it.`,
    link: '/seller/orders',
    dedupeKey: `direct-order-received:${directId}`,
  });
}

// ─── Buyer lifecycle notifications ───────────────────────────────────────────

export async function notifyBuyerOrderPlaced(
  buyerId: string,
  orderId: string,
  itemCount: number,
  amountDueNaira: number,
) {
  const shortId = `#${orderId.slice(-6).toUpperCase()}`;
  await notifyUser({
    userId: buyerId,
    type: NotificationType.ORDER_PLACED,
    title: `Order ${shortId} placed`,
    body:
      amountDueNaira > 0
        ? `Your order of ${itemCount} ${itemCount === 1 ? 'item' : 'items'} is saved. Complete payment of ${formatNaira(amountDueNaira)} so we can process your materials.`
        : `Your order of ${itemCount} ${itemCount === 1 ? 'item' : 'items'} is placed and covered by your savings credit.`,
    link: `/orders/${orderId}`,
    dedupeKey: `order-placed:${orderId}`,
  });
}

export async function notifyBuyerOrderPaid(
  buyerId: string,
  orderId: string,
  itemCount: number,
) {
  const shortId = `#${orderId.slice(-6).toUpperCase()}`;
  await notifyUser({
    userId: buyerId,
    type: NotificationType.ORDER_PAID,
    title: `Payment confirmed for ${shortId}`,
    body: `We've confirmed payment for your ${itemCount} ${itemCount === 1 ? 'item' : 'items'}. Your funds are held safely until we receive your goods.`,
    link: `/orders/${orderId}`,
    dedupeKey: `order-paid:${orderId}`,
  });
}

export async function notifyBuyerOrderUpdate(
  buyerId: string,
  orderId: string,
  title: string,
  body: string,
  dedupeKey?: string,
) {
  await notifyUser({
    userId: buyerId,
    type: NotificationType.ORDER_UPDATE,
    title,
    body,
    link: `/orders/${orderId}`,
    dedupeKey,
  });
}

export async function notifyBuyerSavingsCredited(
  buyerId: string,
  orderId: string,
  materialName: string,
  buyerShareNaira: number,
  dedupeKey: string,
) {
  await notifyUser({
    userId: buyerId,
    type: NotificationType.SAVINGS_CREDITED,
    title: `You saved ${formatNaira(buyerShareNaira)} on ${materialName}`,
    body: `${formatNaira(buyerShareNaira)} has been added to your savings credit after we received and checked your ${materialName}.`,
    link: '/account/savings',
    dedupeKey,
  });
}

export async function notifyBuyerDispatchUpdate(
  buyerId: string,
  orderId: string,
  materialName: string,
  statusLabel: string,
  location?: string | null,
) {
  const shortId = `#${orderId.slice(-6).toUpperCase()}`;
  const locText = location ? ` (${location})` : '';
  await notifyUser({
    userId: buyerId,
    type: NotificationType.DISPATCH_UPDATE,
    title: `Delivery update for ${shortId}: ${statusLabel}`,
    body: `${materialName} is now ${statusLabel.toLowerCase()}${locText}.`,
    link: `/orders/${orderId}`,
  });
}

export async function notifyBuyerPriceAlertsForMaterial(materialId: string) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, name: true, catalogPrice: true, retired: true, needsPriceReview: true },
  });
  if (!material || material.retired || material.needsPriceReview) return 0;

  const matchingAlerts = await prisma.priceAlert.findMany({
    where: {
      materialId: material.id,
      active: true,
      targetPrice: { gte: material.catalogPrice },
      notifiedAt: null,
    },
  });

  const now = new Date();
  for (const alert of matchingAlerts) {
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { notifiedAt: now },
    });
    await notifyUser({
      userId: alert.buyerId,
      type: NotificationType.PRICE_ALERT_REACHED,
      title: `Price alert reached: ${material.name}`,
      body: `${material.name} is now ${formatNaira(Number(material.catalogPrice))} (your target was ${formatNaira(Number(alert.targetPrice))}).`,
      link: `/catalog/${material.id}`,
      dedupeKey: `price-alert:${alert.id}:${Number(material.catalogPrice)}`,
    });
  }
  return matchingAlerts.length;
}

export async function getNotificationsForUser(userId: string, limit = 15) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { notifications, unreadCount };
}

export const getNotificationsForSeller = getNotificationsForUser;
export const getNotificationsForBuyer = getNotificationsForUser;

export async function markNotificationRead(id: string, userId: string) {
  // Scoped to userId too — a notification id alone shouldn't let one
  // user mark another's as read.
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
