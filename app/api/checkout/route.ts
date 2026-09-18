import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type CheckoutInput } from '@/lib/checkout';
import { initiateOrderPayment } from '@/lib/payments/initiateOrderPayment';
import { errorMessage } from '@/lib/errors';

export async function POST(request: NextRequest) {
  let order: Awaited<ReturnType<typeof createOrder>>;

  try {
    const body = (await request.json()) as CheckoutInput;
    order = await createOrder(body);
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error, 'Checkout failed') }, { status: 400 });
  }

  // The order is committed above regardless of payment outcome — a payment
  // failure here must not look like the order never happened.
  try {
    const payment = await initiateOrderPayment(order.id, request.nextUrl.origin);
    return NextResponse.json({ order, payment });
  } catch (error: unknown) {
    return NextResponse.json({ order, paymentError: errorMessage(error, 'Payment initiation failed') });
  }
}
