import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type CheckoutInput } from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutInput;
    const order = await createOrder(body);
    const payment = await initiatePayment(order);

    return NextResponse.json({ order, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Checkout failed' }, { status: 400 });
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
