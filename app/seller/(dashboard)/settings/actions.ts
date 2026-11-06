'use server';

import { revalidatePath } from 'next/cache';
import { CoverageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSellerOwner } from '@/lib/seller/session';
import { recordAudit } from '@/lib/audit';

// The owner asks to cover the ticked zones. Ticking a zone creates (or
// renews) a request that ops approve; unticking a request still waiting
// withdraws it. An approved zone is not removed here: ops revoke those, so a
// seller cannot silently drop coverage they were awarded work in.
export async function saveZoneCoverageAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const owner = await requireSellerOwner();
  try {
    const wanted = new Set(formData.getAll('zoneId').filter((v): v is string => typeof v === 'string'));

    const [zones, existing] = await Promise.all([
      prisma.deliveryZone.findMany({ where: { active: true }, select: { id: true, name: true } }),
      prisma.sellerZoneCoverage.findMany({ where: { sellerId: owner.sellerId } }),
    ]);
    const byZone = new Map(existing.map((e) => [e.zoneId, e]));

    for (const zone of zones) {
      const row = byZone.get(zone.id);
      const wants = wanted.has(zone.id);

      if (wants && !row) {
        await prisma.sellerZoneCoverage.create({ data: { sellerId: owner.sellerId, zoneId: zone.id } });
        await recordAudit({
          actor: { id: owner.userId, role: 'SELLER' },
          action: 'areas.coverage_requested',
          entityType: 'DeliveryZone',
          entityId: zone.id,
          summary: `Requested coverage of ${zone.name}`,
        });
      } else if (wants && row?.status === CoverageStatus.REVOKED) {
        await prisma.sellerZoneCoverage.update({ where: { id: row.id }, data: { status: CoverageStatus.PENDING, decidedAt: null, decidedById: null } });
        await recordAudit({
          actor: { id: owner.userId, role: 'SELLER' },
          action: 'areas.coverage_requested',
          entityType: 'DeliveryZone',
          entityId: zone.id,
          summary: `Asked again to cover ${zone.name}`,
        });
      } else if (!wants && row?.status === CoverageStatus.PENDING) {
        await prisma.sellerZoneCoverage.delete({ where: { id: row.id } });
      }
    }

    revalidatePath('/seller/settings');
    revalidatePath('/admin/areas');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save your delivery zones.' };
  }
}
