import type { Prisma } from '@prisma/client';

type Decimalish = number | Prisma.Decimal;

interface OrderTotalInput {
  items: { priceLocked: Decimalish; quantity: number; deliveryCost: Decimalish }[];
}

// deliveryCost is stored identically on every item of an order (a flat
// per-order charge, not per-item — see lib/checkout/createOrder.ts), so it's
// averaged back out to a single charge rather than summed per item.
export function getOrderTotal(order: OrderTotalInput): number {
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.priceLocked) * item.quantity, 0);
  const deliveryCost =
    order.items.length === 0
      ? 0
      : order.items.reduce((sum, item) => sum + Number(item.deliveryCost), 0) / order.items.length;
  return subtotal + deliveryCost;
}
