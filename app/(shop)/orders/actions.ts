'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireBuyer } from '@/lib/buyer/auth';
import { initiateOrderPayment } from '@/lib/payments/initiateOrderPayment';
import { getRequestOrigin } from '@/lib/http/origin';

export async function retryPaymentAction(formData: FormData) {
  const orderId = formData.get('orderId');
  if (typeof orderId !== 'string') return;

  const buyer = await requireBuyer();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== buyer.id || order.status !== 'PENDING_PAYMENT') return;

  const origin = await getRequestOrigin();
  const { authorizationUrl } = await initiateOrderPayment(orderId, origin);

  redirect(authorizationUrl);
}
