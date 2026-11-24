import { PaymentProvider } from '@prisma/client';
import { prisma } from '../prisma';
import { getOrderTotal } from '../checkout/orderTotal';
import { verifyPaystackTransaction } from './paystack';
import { verifyCredoTransaction } from './credo';
import { confirmOrderPaid } from './confirmOrderPaid';

/**
 * Called when the buyer lands back on the order page from Paystack or Credo Pay's
 * checkout redirect — verifies the transaction directly with the gateway
 * rather than trusting the query string, so it's a safe UX accelerant
 * even before (or without) the webhook arriving. Never throws — a
 * verification hiccup just leaves the order pending for the webhook to
 * confirm later.
 */
export async function verifyAndConfirmOrderPayment(
  orderId: string,
  reference: string,
  transRef?: string,
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;

    const expectedNaira = getOrderTotal(order);
    const expectedKobo = Math.round(expectedNaira * 100);

    if (order.paymentProvider === PaymentProvider.CREDO) {
      // Credo redirects back with ?transRef=...&reference=... (where reference is our businessRef).
      if (order.paymentReference && reference && order.paymentReference !== reference && order.paymentReference !== transRef) {
        return;
      }
      const verifyKey = transRef || reference || order.paymentReference;
      if (!verifyKey) return;

      const result = await verifyCredoTransaction(verifyKey, expectedNaira);
      if (!result.paid) return;
      if (result.amountKobo !== expectedKobo) return;
      if (order.paymentReference && result.reference !== order.paymentReference && result.transRef !== verifyKey) {
        return;
      }

      await confirmOrderPaid(orderId);
      return;
    }

    // Paystack
    if (order.paymentReference !== reference) return;
    const result = await verifyPaystackTransaction(reference);
    if (result.status !== 'success') return;
    if (result.amountKobo !== expectedKobo) return;

    await confirmOrderPaid(orderId);
  } catch {
    // Swallow — the webhook remains the source of truth.
  }
}
