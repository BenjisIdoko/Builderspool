import { prisma } from '../prisma';
import { getOrderTotal } from '../checkout/orderTotal';
import { verifyPaystackTransaction } from './paystack';
import { confirmOrderPaid } from './confirmOrderPaid';

/**
 * Called when the buyer lands back on the order page from Paystack's
 * checkout redirect — verifies the transaction directly with Paystack
 * rather than trusting the query string, so it's a safe UX accelerant
 * even before (or without) the webhook arriving. Never throws — a
 * verification hiccup just leaves the order pending for the webhook to
 * confirm later.
 */
export async function verifyAndConfirmOrderPayment(orderId: string, reference: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.paymentReference !== reference) return;

    const result = await verifyPaystackTransaction(reference);
    if (result.status !== 'success') return;

    const expectedKobo = Math.round(getOrderTotal(order) * 100);
    if (result.amountKobo !== expectedKobo) return;

    await confirmOrderPaid(orderId);
  } catch {
    // Swallow — the webhook remains the source of truth.
  }
}
