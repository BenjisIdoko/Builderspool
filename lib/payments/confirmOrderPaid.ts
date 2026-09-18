import { prisma } from '../prisma';
import { OrderStatus } from '@prisma/client';
import { joinCycleForOrderItem } from '../bidding';

/**
 * Marks an order PAID and joins each of its items to a bid cycle — the one
 * real event that lets an order into demand pooling (see joinCycleForOrderItem).
 * Called from both the Paystack webhook and the checkout-callback verification
 * on the order page, so it's guarded to run exactly once even if both race.
 */
export async function confirmOrderPaid(orderId: string) {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date() },
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  if (count > 0) {
    for (const item of order.items) {
      await joinCycleForOrderItem(item.id);
    }
  }

  return order;
}
