'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireBuyer } from '@/lib/buyer/auth';
import { requestWithdrawal } from '@/lib/wallet';
import { safeAction } from '@/lib/actions/safe';

async function updateBuyerProfileImpl(formData: FormData) {
  const name = formData.get('name');
  const phone = formData.get('phone');
  const businessName = formData.get('businessName');
  const location = formData.get('location');

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Name is required.');
  }

  const buyer = await requireBuyer();
  await prisma.user.update({
    where: { id: buyer.id },
    data: {
      name: name.trim(),
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
      businessName: typeof businessName === 'string' && businessName.trim() ? businessName.trim() : null,
      location: typeof location === 'string' && location.trim() ? location.trim() : null,
    },
  });

  revalidatePath('/account');
}

async function requestWithdrawalActionImpl() {
  const buyer = await requireBuyer();
  await requestWithdrawal(buyer.id);
  revalidatePath('/account');
}

export const requestWithdrawalAction = safeAction(requestWithdrawalActionImpl);

export const updateBuyerProfile = safeAction(updateBuyerProfileImpl);
