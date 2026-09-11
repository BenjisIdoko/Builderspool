import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type CheckoutInput } from '@/lib/checkout';
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
    const payment = await initiatePayment(order);
    return NextResponse.json({ order, payment });
  } catch (error: unknown) {
    return NextResponse.json({ order, paymentError: errorMessage(error, 'Payment initiation failed') });
  }
}

/**
 * TODO: wire in the real Paystack/Flutterwave/e-Transact payment
 * initialization call. Must return a client-redirectable checkout
 * URL/reference for the order's total (sum of priceLocked + deliveryCost
 * across its items).
 */
async function initiatePayment(order: Awaited<ReturnType<typeof createOrder>>): Promise<never> {
  throw new Error(`initiatePayment() not implemented — wire in a payment gateway for order ${order.id}.`);
}
