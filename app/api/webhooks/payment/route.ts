import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaystackWebhookSignature } from '@/lib/payments/paystack';
import { confirmOrderPaid } from '@/lib/payments/confirmOrderPaid';
import { getOrderTotal } from '@/lib/checkout/orderTotal';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  let signatureValid: boolean;
  try {
    signatureValid = verifyPaystackWebhookSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: 'Payment gateway is not configured' }, { status: 500 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Only a successful charge moves an order to PAID — every other event
  // type (failed charge, refund, etc.) is acknowledged and ignored.
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference: string = event.data.reference;
  const order = await prisma.order.findUnique({
    where: { paymentReference: reference },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'No order for this payment reference' }, { status: 404 });
  }

  const expectedKobo = Math.round(getOrderTotal(order) * 100);
  if (event.data.amount !== expectedKobo) {
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  // An order only joins its bid cycles once payment is confirmed here —
  // never at checkout submission — so abandoned/failed payments never
  // inflate demand pools.
  await confirmOrderPaid(order.id);

  return NextResponse.json({ received: true });
}
