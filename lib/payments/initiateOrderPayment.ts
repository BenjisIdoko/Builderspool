import { PaymentProvider } from '@prisma/client';
import { prisma } from '../prisma';
import { getOrderTotal } from '../checkout/orderTotal';
import { initializePaystackTransaction, paystackChannelsFor } from './paystack';
import { initializeCredoTransaction, credoChannelsFor } from './credo';

/**
 * Starts (or restarts) a Paystack or Credo Pay transaction for an order. Each call
 * mints a fresh reference — Order.paymentReference always tracks the latest
 * attempt, so an abandoned first attempt can be retried safely.
 */
export async function initiateOrderPayment(orderId: string, origin: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      buyer: { select: { email: true, name: true, phone: true } },
    },
  });

  const reference = `order_${order.id}_${Date.now()}`;
  const amountNaira = getOrderTotal(order);
  const callbackUrl = `${origin}/orders/${order.id}`;

  if (order.paymentProvider === PaymentProvider.CREDO) {
    const nameParts = order.buyer.name.trim().split(/\s+/);
    const customerFirstName = nameParts[0] || undefined;
    const customerLastName = nameParts.slice(1).join(' ') || undefined;
    const channels = credoChannelsFor(order.paymentMethod);

    const base = {
      email: order.buyer.email,
      amountNaira,
      reference,
      callbackUrl,
      customerFirstName,
      customerLastName,
      customerPhoneNumber: order.buyer.phone ?? undefined,
    };

    let authorizationUrl: string;
    try {
      ({ authorizationUrl } = await initializeCredoTransaction({ ...base, channels }));
    } catch (err) {
      if (!channels) throw err;
      console.error('Credo refused the channel hint; retrying without it:', err instanceof Error ? err.message : err);
      ({ authorizationUrl } = await initializeCredoTransaction(base));
    }

    await prisma.order.update({ where: { id: order.id }, data: { paymentReference: reference } });
    return { authorizationUrl, reference };
  }

  // Default: Paystack
  const base = {
    email: order.buyer.email,
    amountNaira,
    reference,
    // Paystack appends its own ?trxref=...&reference=... to this URL on
    // redirect — adding our own reference param here would duplicate the
    // key and break query-string parsing on the way back.
    callbackUrl,
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
