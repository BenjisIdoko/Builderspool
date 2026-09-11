import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { joinCycleForOrderItem } from '@/lib/bidding';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? request.headers.get('verif-hash');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const orderId: string = event.orderId;

  // An order only joins its bid cycles once payment is confirmed here —
  // never at checkout submission — so abandoned/failed payments never
  // inflate demand pools.
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PAID, paidAt: new Date() },
    include: { items: true },
  });

  for (const item of order.items) {
    await joinCycleForOrderItem(item.id);
  }

  return NextResponse.json({ received: true });
}

/**
 * TODO: wire in real gateway-specific signature verification
 * (Paystack: HMAC-SHA512 of the raw body against the webhook secret,
 * compared to the x-paystack-signature header; Flutterwave: verif-hash
 * header compared to a shared secret).
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  throw new Error('verifySignature() not implemented — wire in gateway-specific verification.');
}
