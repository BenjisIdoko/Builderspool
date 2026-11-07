'use server';

import { prisma } from '@/lib/prisma';
import { requireBuyer } from '@/lib/buyer/auth';

type Result = { error: string } | { ok: true };

// "Tell us you want delivery here": a buyer in a locality we cannot deliver to
// leaves a phone number. One row per phone and locality, so repeats are no-ops.
export async function requestDeliveryAction(localityId: string, phone: string): Promise<Result> {
  await requireBuyer();
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (!/^\+?\d{10,15}$/.test(cleaned)) return { error: 'Enter a phone number we can reach, for example 0803 123 4567.' };

  const locality = await prisma.locality.findFirst({ where: { id: localityId, active: true }, select: { id: true } });
  if (!locality) return { error: 'That area is not available.' };

  await prisma.deliveryRequest.upsert({
    where: { phone_localityId: { phone: cleaned, localityId } },
    create: { phone: cleaned, localityId },
    update: {},
  });
  return { ok: true };
}
