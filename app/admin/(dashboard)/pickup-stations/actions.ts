'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { safeAction } from '@/lib/actions/safe';
import { STATION_REGIONS } from '@/lib/areas/region';

type Result = { error: string } | { ok: true };

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}

function readStation(formData: FormData) {
  const name = text(formData, 'name');
  const region = text(formData, 'region');
  const address = text(formData, 'address');
  if (name.length < 3 || name.length > 80) throw new Error('Enter a station name of 3 to 80 characters.');
  if (!(STATION_REGIONS as readonly string[]).includes(region)) throw new Error('Choose the region this station is in.');
  if (address.length < 8 || address.length > 200) throw new Error('Enter the full street address, so buyers can find it.');
  return { name, region, address };
}

const label = (region: string) => region.charAt(0) + region.slice(1).toLowerCase();

// Adds a place buyers can collect orders from. It shows on every buyer's account
// page and at checkout straight away, so the details are checked here.
export async function addPickupStationAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const data = readStation(formData);
    if (await prisma.fulfillmentCenter.findFirst({ where: { name: { equals: data.name, mode: 'insensitive' }, region: data.region } })) {
      throw new Error(`${label(data.region)} already has a station called ${data.name}.`);
    }
    const station = await prisma.fulfillmentCenter.create({ data });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'pickup_station.created',
      entityType: 'FulfillmentCenter',
      entityId: station.id,
      summary: `Added pickup station ${data.name} (${label(data.region)})`,
    });
    revalidatePath('/admin/pickup-stations');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add that station.' };
  }
}

// Orders already placed keep pointing at this station, so a change of name or
// address shows on them too. Moving a station to another region is refused once
// orders exist, since those orders were placed for the old region.
export async function updatePickupStationAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const id = text(formData, 'id');
    const data = readStation(formData);
    const station = await prisma.fulfillmentCenter.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
    if (!station) throw new Error('That station no longer exists. Refresh the page.');
    if (station.region !== data.region && station._count.orderItems > 0) {
      throw new Error('Orders were already placed for this station, so it can’t move to another region. Add a new station there instead.');
    }
    const clash = await prisma.fulfillmentCenter.findFirst({
      where: { id: { not: id }, name: { equals: data.name, mode: 'insensitive' }, region: data.region },
    });
    if (clash) throw new Error(`${label(data.region)} already has a station called ${data.name}.`);

    await prisma.fulfillmentCenter.update({ where: { id }, data });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'pickup_station.updated',
      entityType: 'FulfillmentCenter',
      entityId: id,
      summary: `Updated pickup station ${station.name}${station.name !== data.name ? ` (now ${data.name})` : ''}`,
    });
    revalidatePath('/admin/pickup-stations');
    revalidatePath('/account');
    revalidatePath('/checkout');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save that station.' };
  }
}

// Only a station nothing depends on can go: no order was ever routed through it, and
// it isn't the last one in its region (checkout would then have nowhere to send pickups).
async function deletePickupStationImpl(formData: FormData) {
  const admin = await requireAdminUser();
  const id = text(formData, 'id');
  const station = await prisma.fulfillmentCenter.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!station) throw new Error('That station no longer exists. Refresh the page.');
  if (station._count.orderItems > 0) throw new Error('Orders were placed for this station, so it can’t be deleted. Edit it instead.');
  const inRegion = await prisma.fulfillmentCenter.count({ where: { region: station.region } });
  if (inRegion <= 1) throw new Error(`This is the only station in ${label(station.region)}. Add another one first, so buyers there can still collect.`);

  // Buyers who saved it fall back to their region's default (the column clears itself).
  await prisma.fulfillmentCenter.delete({ where: { id } });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: 'pickup_station.deleted',
    entityType: 'FulfillmentCenter',
    entityId: id,
    summary: `Deleted pickup station ${station.name} (${label(station.region)})`,
  });
  revalidatePath('/admin/pickup-stations');
  revalidatePath('/account');
  revalidatePath('/checkout');
}

export const deletePickupStationAction = safeAction(deletePickupStationImpl);
