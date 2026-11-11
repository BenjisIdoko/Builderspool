import { prisma } from '../prisma';
import { getOrderTotal } from '../checkout/orderTotal';
import { initializePaystackTransaction, paystackChannelsFor } from './paystack';

/**
 * Starts (or restarts) a Paystack transaction for an order. Each call mints
 * a fresh reference — Order.paymentReference always tracks the latest
 * attempt, so an abandoned first attempt can be retried safely.
 */
export async function initiateOrderPayment(orderId: string, origin: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, buyer: { select: { email: true } } },
  });

  const reference = `order_${order.id}_${Date.now()}`;
  const amountNaira = getOrderTotal(order);

  const base = {
    email: order.buyer.email,
    amountNaira,
    reference,
    // Paystack appends its own ?trxref=...&reference=... to this URL on
    // redirect — adding our own reference param here would duplicate the
    // key and break query-string parsing on the way back.
    callbackUrl: `${origin}/orders/${order.id}`,
  };

  // Show the way to pay the buyer chose (a large order by bank transfer should not open a card form).
  // If Paystack refuses the hint, ask again without it rather than blocking the payment.
  const channels = paystackChannelsFor(order.paymentMethod);
  let authorizationUrl: string;
  try {
    ({ authorizationUrl } = await initializePaystackTransaction({ ...base, channels }));
  } catch (err) {
    if (!channels) throw err;
    console.error('Paystack refused the channel hint; retrying without it:', err instanceof Error ? err.message : err);
    ({ authorizationUrl } = await initializePaystackTransaction(base));
  }

  await prisma.order.update({ where: { id: order.id }, data: { paymentReference: reference } });

  return { authorizationUrl, reference };
}
