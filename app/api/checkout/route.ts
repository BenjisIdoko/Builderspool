import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type CheckoutInput } from '@/lib/checkout';
import { initiateOrderPayment } from '@/lib/payments/initiateOrderPayment';
import { errorMessage } from '@/lib/errors';
import { getCurrentBuyer } from '@/lib/buyer/auth';

export async function POST(request: NextRequest) {
  // The buyer is always the session's own account — never a client-supplied
  // id, which would let anyone place orders (and wipe the cart) as any buyer.
  const buyer = await getCurrentBuyer();
  if (!buyer) {
    return NextResponse.json({ error: 'Sign in to check out.' }, { status: 401 });
  }

  let order: Awaited<ReturnType<typeof createOrder>>;

  try {
    const body = (await request.json()) as Omit<CheckoutInput, 'buyerId'>;
    order = await createOrder({ ...body, buyerId: buyer.id });
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
