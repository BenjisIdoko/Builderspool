import { CoverageStatus, KycStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

export type CheckoutZone = { id: string; name: string; fee: number | null; sellerCount: number };
export type CheckoutLocality = { id: string; name: string; zone: CheckoutZone | null };
export type CheckoutAreas = {
  enabled: boolean;
  lgas: { id: string; name: string; localities: CheckoutLocality[] }[];
};

// What the checkout locality picker needs. A zone's seller count is the verified,
// active sellers who serve it: approved coverage of that zone, or national supply.
// Nothing is loaded while the picker is switched off.
export async function getCheckoutAreas(): Promise<CheckoutAreas> {
  if (!(await getSetting<boolean>('areas.checkoutPickerEnabled'))) return { enabled: false, lgas: [] };

  const [lgas, sellers] = await Promise.all([
    prisma.lga.findMany({
      where: { active: true, state: { active: true } },
      orderBy: { name: 'asc' },
      include: {
        localities: {
          where: { active: true },
          orderBy: { name: 'asc' },
          include: { zone: { select: { id: true, name: true, active: true, deliveryFee: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.SELLER, disabledAt: null, sellerProfile: { is: { kycStatus: KycStatus.APPROVED, suspendedAt: null } } },
      select: {
        sellerProfile: { select: { nationalSupply: true } },
        zoneCoverage: { where: { status: CoverageStatus.APPROVED }, select: { zoneId: true } },
      },
    }),
  ]);

  const national = sellers.filter((s) => s.sellerProfile?.nationalSupply).length;
  const perZone = new Map<string, number>();
  for (const s of sellers) {
    if (s.sellerProfile?.nationalSupply) continue; // already counted for every zone
    for (const c of s.zoneCoverage) perZone.set(c.zoneId, (perZone.get(c.zoneId) ?? 0) + 1);
  }

  return {
    enabled: true,
    lgas: lgas
      .map((l) => ({
        id: l.id,
        name: l.name,
        localities: l.localities.map((loc) => ({
          id: loc.id,
          name: loc.name,
          zone:
            loc.zone && loc.zone.active
              ? {
                  id: loc.zone.id,
                  name: loc.zone.name,
                  fee: loc.zone.deliveryFee === null ? null : Number(loc.zone.deliveryFee),
                  sellerCount: national + (perZone.get(loc.zone.id) ?? 0),
                }
              : null,
        })),
      }))
      .filter((l) => l.localities.length > 0),
  };
}
