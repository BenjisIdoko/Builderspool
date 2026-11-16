'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { safeAction } from '@/lib/actions/safe';

function num(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// Empty means "not set". Anything else must be a number inside the range.
function optionalNumber(raw: string, label: string, min: number, max: number): number | null {
  if (raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be a number from ${min} to ${max}.`);
  return n;
}

async function saveVehicleClassImpl(formData: FormData) {
  const admin = await requireAdminUser();
  const id = num(formData, 'id');
  const vehicle = await prisma.vehicleClass.findUnique({ where: { id } });
  if (!vehicle) throw new Error('That vehicle class no longer exists. Refresh the page.');

  const maxLoadKg = optionalNumber(num(formData, 'maxLoadKg'), 'Maximum load', 1, 100000);
  if (maxLoadKg === null || !Number.isInteger(maxLoadKg)) throw new Error('Maximum load must be a whole number of kilograms.');
  const maxLengthM = optionalNumber(num(formData, 'maxLengthM'), 'Longest item', 0.1, 30);
  const ratePerKm = optionalNumber(num(formData, 'ratePerKm'), 'Rate per km', 0, 100000);
  const active = formData.get('active') === 'on';
  if (active && ratePerKm === null) throw new Error(`Set a rate per km for ${vehicle.name} before switching it on.`);

  await prisma.vehicleClass.update({ where: { id }, data: { maxLoadKg, maxLengthM, ratePerKm, active } });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: 'delivery.vehicle_class_updated',
    entityType: 'VehicleClass',
    entityId: id,
    summary: `Updated ${vehicle.name}: ${maxLoadKg} kg, ${ratePerKm === null ? 'no rate' : `₦${ratePerKm}/km`}, ${active ? 'on' : 'off'}`,
    metadata: { from: { maxLoadKg: vehicle.maxLoadKg, maxLengthM: vehicle.maxLengthM?.toString() ?? null, ratePerKm: vehicle.ratePerKm?.toString() ?? null, active: vehicle.active }, to: { maxLoadKg, maxLengthM, ratePerKm, active } },
  });
  revalidatePath('/admin/delivery-pricing');
}

async function saveMaterialWeightImpl(formData: FormData) {
  const admin = await requireAdminUser();
  const id = num(formData, 'id');
  const material = await prisma.material.findUnique({ where: { id }, select: { name: true } });
  if (!material) throw new Error('That item no longer exists. Refresh the page.');

  const unitWeightKg = optionalNumber(num(formData, 'unitWeightKg'), 'Weight per unit', 0.001, 100000);
  const longestSideM = optionalNumber(num(formData, 'longestSideM'), 'Longest side', 0.01, 30);
  const confirmed = formData.get('confirmed') === 'on';
  if (confirmed && unitWeightKg === null) throw new Error(`Enter a weight for ${material.name} before confirming it.`);

  await prisma.material.update({
    where: { id },
    data: { unitWeightKg, longestSideM, weightConfirmedAt: confirmed ? new Date() : null },
  });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: 'delivery.material_weight_updated',
    entityType: 'Material',
    entityId: id,
    summary: `${material.name}: ${unitWeightKg ?? 'no weight'} kg per unit${confirmed ? ', confirmed' : ', not confirmed'}`,
  });
  revalidatePath('/admin/delivery-pricing');
}

export const saveVehicleClassAction = safeAction(saveVehicleClassImpl);
export const saveMaterialWeightAction = safeAction(saveMaterialWeightImpl);
