import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCredoWebhookSignature, verifyCredoTransaction } from '@/lib/payments/credo';
import { confirmOrderPaid } from '@/lib/payments/confirmOrderPaid';
import { getOrderTotal } from '@/lib/checkout/orderTotal';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-credo-signature') ?? request.headers.get('credo-signature');

  let signatureValid: boolean;
  try {
    signatureValid = verifyCredoWebhookSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: 'Credo Pay gateway is not configured' }, { status: 500 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      transRef?: string;
      businessRef?: string;
      reference?: string;
      transAmount?: number;
      amount?: number;
      status?: number | string;
    };
  };

  if (payload.event !== 'transaction.successful') {
    return NextResponse.json({ received: true });
  }

  const refs = [payload.data?.businessRef, payload.data?.reference, payload.data?.transRef].filter(
    (r): r is string => Boolean(r && r.trim()),
  );
  if (refs.length === 0) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { paymentReference: { in: refs } },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'No order for this payment reference' }, { status: 404 });
  }

  // Server-side verification against Credo's verify API to confirm paid status & exact amount
  const verifyRef = payload.data?.transRef ?? order.paymentReference!;
  const expectedNaira = getOrderTotal(order);
  const expectedKobo = Math.round(expectedNaira * 100);

  try {
    const verified = await verifyCredoTransaction(verifyRef, expectedNaira);
    if (!verified.paid) {
      return NextResponse.json({ received: true, ignored: 'Transaction not marked paid' });
    }
    if (verified.amountKobo !== expectedKobo) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }
  } catch (err) {
    console.error('Credo webhook verify call failed:', err);
    return NextResponse.json({ error: 'Could not verify transaction with Credo' }, { status: 502 });
  }

  await confirmOrderPaid(order.id);
  return NextResponse.json({ received: true });
}
