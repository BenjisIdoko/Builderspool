import {
  AllocationStatus,
  DirectStatus,
  NotificationType,
  OrderStatus,
  SheetAwardStatus,
  SheetStatus,
} from '@prisma/client';
import { prisma } from '../prisma';
import { formatLagosClock, formatNaira } from '../format';
import { getOrderTotal } from '../checkout/orderTotal';
import { notifyUser, notifyBuyerPriceAlertsForMaterial } from './index';

export interface ReminderReport {
  unpaidOrderReminders: number;
  cartReminders: number;
  sellerAllocationReminders: number;
  sellerDirectReminders: number;
  sellerSheetAwardReminders: number;
  priceAlertsTriggered: number;
}

/**
 * Runs periodic e-commerce reminders:
 * 1. Buyers with PENDING_PAYMENT orders older than 30 minutes (within the last 24h).
 * 2. Buyers with items left in their cart for over 2 hours (and no order placed since).
 * 3. Sellers with pending pool allocations expiring within 30 minutes.
 * 4. Sellers with pending Buy Direct order lines expiring within 2 hours.
 * 5. Sellers with pending Category Sheet awards expiring within 20 minutes.
 * 6. Active price alerts where the material's catalogue price is at or below the target price.
 *
 * Every reminder uses a deterministic `dedupeKey` in `notifyUser`, so running
 * this every minute from `/api/pool/tick` or cron never sends duplicate alerts.
 */
export async function runAutomatedReminders(now = new Date()): Promise<ReminderReport> {
  const report: ReminderReport = {
    unpaidOrderReminders: 0,
    cartReminders: 0,
    sellerAllocationReminders: 0,
    sellerDirectReminders: 0,
    sellerSheetAwardReminders: 0,
    priceAlertsTriggered: 0,
  };

  // 1. Unpaid order reminders (placed 30m – 24h ago, still PENDING_PAYMENT)
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60_000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3_600_000);
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: { lte: thirtyMinsAgo, gte: twentyFourHoursAgo },
    },
    include: { items: true },
    take: 50,
  });

  for (const order of pendingOrders) {
    const shortId = `#${order.id.slice(-6).toUpperCase()}`;
    const due = getOrderTotal(order);
    const sent = await notifyUser({
      userId: order.buyerId,
      type: NotificationType.PAYMENT_REMINDER,
      title: `Complete payment for order ${shortId}`,
      body: `Your order ${shortId} (${formatNaira(due)}) is waiting for payment so it can join today's fulfilment.`,
      link: `/orders/${order.id}`,
      dedupeKey: `reminder:unpaid-order:${order.id}`,
    });
    if (sent) report.unpaidOrderReminders++;
  }

  // 2. Cart abandonment reminders (cart updated 2h – 48h ago)
  const twoHoursAgo = new Date(now.getTime() - 2 * 3_600_000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 3_600_000);
  const staleCartItems = await prisma.cartItem.findMany({
    where: {
      updatedAt: { lte: twoHoursAgo, gte: fortyEightHoursAgo },
    },
    include: { material: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const cartByBuyer = new Map<string, { count: number; latestKey: string; firstMaterial: string }>();
  for (const item of staleCartItems) {
    const dayKey = item.updatedAt.toISOString().slice(0, 10);
    const existing = cartByBuyer.get(item.buyerId);
    if (!existing) {
      cartByBuyer.set(item.buyerId, {
        count: 1,
        latestKey: dayKey,
        firstMaterial: item.material.name,
      });
    } else {
      existing.count++;
    }
  }

  for (const [buyerId, info] of cartByBuyer) {
    const sent = await notifyUser({
      userId: buyerId,
      type: NotificationType.CART_REMINDER,
      title: 'Materials waiting in your cart',
      body:
        info.count === 1
          ? `${info.firstMaterial} is still in your cart. Check out before the daily pool closes.`
          : `${info.firstMaterial} and ${info.count - 1} other ${info.count - 1 === 1 ? 'material are' : 'materials are'} waiting in your cart.`,
      link: '/cart',
      dedupeKey: `reminder:cart:${buyerId}:${info.latestKey}`,
    });
    if (sent) report.cartReminders++;
  }

  // 3. Seller allocation acceptance reminders (expiring within 30m)
  const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60_000);
  const expiringAllocations = await prisma.allocation.findMany({
    where: {
      status: AllocationStatus.PENDING,
      acceptDeadlineAt: { gt: now, lte: thirtyMinsFromNow },
    },
    include: {
      bid: { include: { material: { select: { name: true, unit: true } } } },
    },
    take: 50,
  });

  for (const alloc of expiringAllocations) {
    const sent = await notifyUser({
      userId: alloc.bid.sellerId,
      type: NotificationType.ACCEPT_REMINDER,
      title: 'Reminder: accept your pool award',
      body: `You have until ${formatLagosClock(alloc.acceptDeadlineAt!)} to accept ${alloc.quantityFilled} ${alloc.bid.material.unit} of ${alloc.bid.material.name} before it passes to the next supplier.`,
      link: '/seller/allocations',
      dedupeKey: `reminder:allocation-accept:${alloc.id}`,
    });
    if (sent) report.sellerAllocationReminders++;
  }

  // 4. Seller Buy Direct acceptance reminders (expiring within 2h)
  const twoHoursFromNow = new Date(now.getTime() + 2 * 3_600_000);
  const expiringDirect = await prisma.directFulfilment.findMany({
    where: {
      status: DirectStatus.AWAITING_ACCEPT,
      acceptDeadlineAt: { gt: now, lte: twoHoursFromNow },
    },
    include: {
      orderItem: { include: { material: { select: { name: true, unit: true } } } },
    },
    take: 50,
  });

  for (const dir of expiringDirect) {
    const sent = await notifyUser({
      userId: dir.sellerId,
      type: NotificationType.ACCEPT_REMINDER,
      title: 'Reminder: Buy Direct order awaiting acceptance',
      body: `Accept ${dir.quantity} ${dir.orderItem.material.unit} of ${dir.orderItem.material.name} by ${formatLagosClock(dir.acceptDeadlineAt)} or the order line will expire.`,
      link: '/seller/orders',
      dedupeKey: `reminder:direct-accept:${dir.id}`,
    });
    if (sent) report.sellerDirectReminders++;
  }

  // 5. Seller Category Sheet award acceptance reminders (expiring within 20m)
  const twentyMinsFromNow = new Date(now.getTime() + 20 * 60_000);
  const expiringSheetAwards = await prisma.sheetAward.findMany({
    where: {
      status: SheetAwardStatus.OFFERED,
      expiresAt: { gt: now, lte: twentyMinsFromNow },
      sheet: { status: SheetStatus.AWARDING },
    },
    include: {
      sheet: { select: { id: true, category: true } },
      bid: { select: { sellerId: true } },
    },
    take: 50,
  });

  for (const award of expiringSheetAwards) {
    const sent = await notifyUser({
      userId: award.bid.sellerId,
      type: NotificationType.ACCEPT_REMINDER,
      title: `Reminder: accept ${award.sheet.category} sheet`,
      body: `Your window to accept the ${award.sheet.category} sheet closes at ${formatLagosClock(award.expiresAt!)}.`,
      link: `/seller/rfqs/${award.sheet.id}`,
      dedupeKey: `reminder:sheet-award:${award.id}`,
    });
    if (sent) report.sellerSheetAwardReminders++;
  }

  // 6. Sweep any un-notified price alerts whose target price has already been met
  const pendingAlerts = await prisma.priceAlert.findMany({
    where: { active: true, notifiedAt: null },
    select: { materialId: true },
    distinct: ['materialId'],
    take: 50,
  });
  for (const { materialId } of pendingAlerts) {
    report.priceAlertsTriggered += await notifyBuyerPriceAlertsForMaterial(materialId);
  }

  return report;
}
