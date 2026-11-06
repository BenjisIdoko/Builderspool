'use server';

import { revalidatePath } from 'next/cache';
import { CoverageStatus, LocalityKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

type Result = { error: string } | { ok: true };

// Sets (or clears) a zone's delivery fee. The business owns this number: blank
// means "no fee set", which keeps the zone pickup-only. Never defaulted here.
export async function setZoneFeeAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const zoneId = text(formData, 'zoneId');
    const raw = text(formData, 'fee');
    const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new Error('That zone no longer exists.');

    let fee: number | null = null;
    if (raw !== '') {
      fee = Number(raw.replace(/[,\s]/g, ''));
      if (!Number.isFinite(fee) || fee < 0 || fee > 10_000_000) throw new Error('Enter a delivery fee in naira, or leave it blank for none.');
      fee = Math.round(fee);
    }

    await prisma.deliveryZone.update({ where: { id: zoneId }, data: { deliveryFee: fee } });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'areas.zone_fee_set',
      entityType: 'DeliveryZone',
      entityId: zoneId,
      summary: `Delivery fee for ${zone.name}: ${zone.deliveryFee === null ? 'none' : Number(zone.deliveryFee)} -> ${fee ?? 'none'}`,
    });
    revalidatePath('/admin/areas');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save the fee.' };
  }
}

export async function setZoneActiveAction(formData: FormData) {
  const admin = await requireAdminUser();
  const zoneId = text(formData, 'zoneId');
  const active = text(formData, 'active') === 'true';
  const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!zone || zone.active === active) return;
  await prisma.deliveryZone.update({ where: { id: zoneId }, data: { active } });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: active ? 'areas.zone_activated' : 'areas.zone_deactivated',
    entityType: 'DeliveryZone',
    entityId: zoneId,
    summary: `${active ? 'Activated' : 'Deactivated'} zone ${zone.name}`,
  });
  revalidatePath('/admin/areas');
}

export async function addZoneAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const name = text(formData, 'name');
    if (name.length < 3) throw new Error('Enter a zone name.');
    if (await prisma.deliveryZone.findUnique({ where: { name } })) throw new Error('A zone with that name already exists.');
    const zone = await prisma.deliveryZone.create({ data: { name } });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'areas.zone_created',
      entityType: 'DeliveryZone',
      entityId: zone.id,
      summary: `Created zone ${name} (no fee set)`,
    });
    revalidatePath('/admin/areas');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add that zone.' };
  }
}

// Moving a locality never touches existing orders or open pools; those carry
// their own zone. It only decides where new addresses fall.
export async function setLocalityZoneAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const localityId = text(formData, 'localityId');
    const zoneRaw = text(formData, 'zoneId');
    const zoneId = zoneRaw === '' ? null : zoneRaw;

    const locality = await prisma.locality.findUnique({ where: { id: localityId }, include: { zone: true } });
    if (!locality) throw new Error('That locality no longer exists.');
    const zone = zoneId ? await prisma.deliveryZone.findUnique({ where: { id: zoneId } }) : null;
    if (zoneId && !zone) throw new Error('That zone no longer exists.');
    if ((locality.zoneId ?? null) === zoneId) return { ok: true };

    await prisma.locality.update({ where: { id: localityId }, data: { zoneId } });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'areas.locality_moved',
      entityType: 'Locality',
      entityId: localityId,
      summary: `${locality.name}: ${locality.zone?.name ?? 'no zone'} -> ${zone?.name ?? 'no zone'}`,
    });
    revalidatePath('/admin/areas');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not move that locality.' };
  }
}

export async function addLocalityAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const lgaId = text(formData, 'lgaId');
    const name = text(formData, 'name');
    const kind = text(formData, 'kind') as LocalityKind;
    if (name.length < 2) throw new Error('Enter a locality name.');
    if (!Object.values(LocalityKind).includes(kind)) throw new Error('Choose city, town or district.');
    const lga = await prisma.lga.findUnique({ where: { id: lgaId } });
    if (!lga) throw new Error('Choose an Area Council.');
    if (await prisma.locality.findUnique({ where: { lgaId_name: { lgaId, name } } })) {
      throw new Error(`${lga.name} already has a locality called ${name}.`);
    }
    const locality = await prisma.locality.create({ data: { lgaId, name, kind } });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'areas.locality_created',
      entityType: 'Locality',
      entityId: locality.id,
      summary: `Added ${name} to ${lga.name} (no zone yet)`,
    });
    revalidatePath('/admin/areas');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add that locality.' };
  }
}

export async function decideCoverageAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = text(formData, 'coverageId');
  const approve = text(formData, 'decision') === 'approve';
  const row = await prisma.sellerZoneCoverage.findUnique({
    where: { id },
    include: { zone: { select: { name: true } }, seller: { select: { name: true, businessName: true } } },
  });
  if (!row || row.status !== CoverageStatus.PENDING) return;
  await prisma.sellerZoneCoverage.update({
    where: { id },
    data: { status: approve ? CoverageStatus.APPROVED : CoverageStatus.REVOKED, decidedAt: new Date(), decidedById: admin.id },
  });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: approve ? 'areas.coverage_approved' : 'areas.coverage_declined',
    entityType: 'SellerZoneCoverage',
    entityId: id,
    summary: `${approve ? 'Approved' : 'Declined'} ${row.seller.businessName ?? row.seller.name} for ${row.zone.name}`,
  });
  revalidatePath('/admin/areas');
}

export async function setNationalSupplyAction(formData: FormData) {
  const admin = await requireAdminUser();
  const sellerId = text(formData, 'sellerId');
  const national = text(formData, 'national') === 'true';
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: sellerId }, include: { user: { select: { name: true, businessName: true } } } });
  if (!profile || profile.nationalSupply === national) return;
  await prisma.sellerProfile.update({ where: { userId: sellerId }, data: { nationalSupply: national } });
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: 'areas.national_supply_set',
    entityType: 'SellerProfile',
    entityId: profile.id,
    summary: `${profile.user.businessName ?? profile.user.name}: national supply ${national ? 'on' : 'off'}`,
  });
  revalidatePath('/admin/areas');
}
