import { CoverageStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Admin view of the service areas: zones with their fee and counts, every
// locality grouped by Area Council, and seller coverage requests.
export async function getAreasOverview() {
  const [zones, lgas, requests, sellers] = await Promise.all([
    prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { localities: true } },
        coverage: { where: { status: CoverageStatus.APPROVED }, select: { id: true } },
      },
    }),
    prisma.lga.findMany({
      orderBy: { name: 'asc' },
      include: {
        state: { select: { name: true } },
        localities: { orderBy: { name: 'asc' }, include: { zone: { select: { id: true, name: true } } } },
      },
    }),
    prisma.sellerZoneCoverage.findMany({
      where: { status: CoverageStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        zone: { select: { name: true } },
        seller: { select: { id: true, name: true, businessName: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.SELLER },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        businessName: true,
        sellerProfile: { select: { nationalSupply: true } },
        zoneCoverage: { where: { status: CoverageStatus.APPROVED }, select: { zone: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      active: z.active,
      deliveryFee: z.deliveryFee === null ? null : Number(z.deliveryFee),
      localityCount: z._count.localities,
      approvedSellerCount: z.coverage.length,
    })),
    lgas: lgas.map((l) => ({
      id: l.id,
      name: l.name,
      stateName: l.state.name,
      localities: l.localities.map((loc) => ({
        id: loc.id,
        name: loc.name,
        kind: loc.kind,
        active: loc.active,
        zoneId: loc.zoneId,
        zoneName: loc.zone?.name ?? null,
      })),
    })),
    requests: requests.map((r) => ({
      id: r.id,
      zoneName: r.zone.name,
      sellerName: r.seller.businessName ?? r.seller.name,
    })),
    sellers: sellers.map((s) => ({
      id: s.id,
      name: s.businessName ?? s.name,
      nationalSupply: s.sellerProfile?.nationalSupply ?? false,
      zones: s.zoneCoverage.map((c) => c.zone.name),
    })),
  };
}

export type AreasOverview = Awaited<ReturnType<typeof getAreasOverview>>;

// A seller's own coverage, for their settings page.
export async function getSellerCoverage(sellerId: string) {
  const [zones, mine, profile] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.sellerZoneCoverage.findMany({ where: { sellerId }, select: { zoneId: true, status: true } }),
    prisma.sellerProfile.findUnique({ where: { userId: sellerId }, select: { nationalSupply: true } }),
  ]);
  const statusByZone = new Map(mine.map((m) => [m.zoneId, m.status]));
  return {
    nationalSupply: profile?.nationalSupply ?? false,
    zones: zones.map((z) => ({ id: z.id, name: z.name, status: statusByZone.get(z.id) ?? null })),
  };
}
