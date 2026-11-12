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

  revalidatePath('/account', 'layout');
}

async function requestWithdrawalActionImpl() {
  const buyer = await requireBuyer();
  await requestWithdrawal(buyer.id);
  revalidatePath('/account', 'layout');
}

export const requestWithdrawalAction = safeAction(requestWithdrawalActionImpl);

export const updateBuyerProfile = safeAction(updateBuyerProfileImpl);

// The buyer's saved pickup station. An empty id clears it. The station must exist,
// so a stale page can't save a station that has since gone.
async function setPickupCenterImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const raw = formData.get('centerId');
  const centerId = typeof raw === 'string' ? raw.trim() : '';

  if (centerId) {
    const center = await prisma.fulfillmentCenter.findUnique({ where: { id: centerId }, select: { id: true } });
    if (!center) throw new Error('That pickup station is no longer available. Refresh the page and choose another.');
  }
  await prisma.user.update({ where: { id: buyer.id }, data: { pickupCenterId: centerId || null } });
  revalidatePath('/account', 'layout');
  revalidatePath('/checkout');
}

export const setPickupCenterAction = safeAction(setPickupCenterImpl);
