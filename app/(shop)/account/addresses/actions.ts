'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireBuyer } from '@/lib/buyer/auth';
import { safeAction } from '@/lib/actions/safe';

type Result = { error: string } | { ok: true };

const MAX_ADDRESSES = 10;

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}

function refresh() {
  revalidatePath('/account', 'layout');
  revalidatePath('/checkout');
}

// ─── Pickup stations ─────────────────────────────────────────────────────────
// A buyer saves stations from the ones we run. Their default is User.pickupCenterId
// and is always a saved one.

async function addSavedStationImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const centerId = text(formData, 'centerId');
  const center = await prisma.fulfillmentCenter.findUnique({ where: { id: centerId }, select: { id: true } });
  if (!center) throw new Error('That pickup station is no longer available. Refresh the page.');

  await prisma.buyerPickupStation.upsert({
    where: { buyerId_centerId: { buyerId: buyer.id, centerId } },
    create: { buyerId: buyer.id, centerId },
    update: {},
  });
  // The first station a buyer saves becomes their default.
  if (!buyer.pickupCenterId) await prisma.user.update({ where: { id: buyer.id }, data: { pickupCenterId: centerId } });
  refresh();
}

async function setDefaultStationImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const centerId = text(formData, 'centerId');
  const saved = await prisma.buyerPickupStation.findUnique({ where: { buyerId_centerId: { buyerId: buyer.id, centerId } } });
  if (!saved) throw new Error('Save that station first, then make it your default.');
  await prisma.user.update({ where: { id: buyer.id }, data: { pickupCenterId: centerId } });
  refresh();
}

async function removeSavedStationImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const centerId = text(formData, 'centerId');
  await prisma.buyerPickupStation.deleteMany({ where: { buyerId: buyer.id, centerId } });
  // If it was the default, the next saved station takes over, or there is none.
  if (buyer.pickupCenterId === centerId) {
    const next = await prisma.buyerPickupStation.findFirst({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'asc' } });
    await prisma.user.update({ where: { id: buyer.id }, data: { pickupCenterId: next?.centerId ?? null } });
  }
  refresh();
}

export const addSavedStationAction = safeAction(addSavedStationImpl);
export const setDefaultStationAction = safeAction(setDefaultStationImpl);
export const removeSavedStationAction = safeAction(removeSavedStationImpl);

// ─── Delivery addresses ──────────────────────────────────────────────────────

function readAddress(formData: FormData) {
  const contactName = text(formData, 'contactName');
  const contactPhone = text(formData, 'contactPhone').replace(/[\s()-]/g, '');
  const address = text(formData, 'address');
  const landmark = text(formData, 'landmark');
  const localityId = text(formData, 'localityId');
  if (contactName.length < 2 || contactName.length > 80) throw new Error('Enter the name of the person who will receive the delivery.');
  if (!/^\+?\d{10,15}$/.test(contactPhone)) throw new Error('Enter a phone number we can reach, for example 0803 123 4567.');
  if (address.length < 8 || address.length > 200) throw new Error('Enter the full address, so the driver can find it.');
  if (landmark.length > 120) throw new Error('Keep the landmark under 120 characters.');
  return { contactName, contactPhone, address, landmark: landmark || null, localityId: localityId || null };
}

// Adds an address, or updates one when an id is sent. The first address is the default.
export async function saveAddressAction(formData: FormData): Promise<Result> {
  const buyer = await requireBuyer();
  try {
    const data = readAddress(formData);
    if (data.localityId && !(await prisma.locality.findFirst({ where: { id: data.localityId, active: true }, select: { id: true } }))) {
      throw new Error('That area isn’t available. Choose another.');
    }
    const id = text(formData, 'id');
    if (id) {
      const mine = await prisma.buyerAddress.findFirst({ where: { id, buyerId: buyer.id }, select: { id: true } });
      if (!mine) throw new Error('That address no longer exists. Refresh the page.');
      await prisma.buyerAddress.update({ where: { id }, data });
    } else {
      const count = await prisma.buyerAddress.count({ where: { buyerId: buyer.id } });
      if (count >= MAX_ADDRESSES) throw new Error(`You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`);
      await prisma.buyerAddress.create({ data: { ...data, buyerId: buyer.id, isDefault: count === 0 } });
    }
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save that address.' };
  }
}

async function setDefaultAddressImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const id = text(formData, 'id');
  const mine = await prisma.buyerAddress.findFirst({ where: { id, buyerId: buyer.id }, select: { id: true } });
  if (!mine) throw new Error('That address no longer exists. Refresh the page.');
  await prisma.$transaction([
    prisma.buyerAddress.updateMany({ where: { buyerId: buyer.id }, data: { isDefault: false } }),
    prisma.buyerAddress.update({ where: { id }, data: { isDefault: true } }),
  ]);
  refresh();
}

async function deleteAddressImpl(formData: FormData) {
  const buyer = await requireBuyer();
  const id = text(formData, 'id');
  const mine = await prisma.buyerAddress.findFirst({ where: { id, buyerId: buyer.id } });
  if (!mine) throw new Error('That address no longer exists. Refresh the page.');
  await prisma.buyerAddress.delete({ where: { id } });
  // If it was the default, the oldest remaining address takes over.
  if (mine.isDefault) {
    const next = await prisma.buyerAddress.findFirst({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'asc' } });
    if (next) await prisma.buyerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  refresh();
}

export const setDefaultAddressAction = safeAction(setDefaultAddressImpl);
export const deleteAddressAction = safeAction(deleteAddressImpl);
