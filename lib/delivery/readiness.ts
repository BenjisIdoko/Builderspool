import { prisma } from '@/lib/prisma';
import { isMapsConfigured } from './distance';

export type ReadinessCheck = { id: string; label: string; ready: boolean; detail: string };

// What must be true before delivery pricing can be turned on. Each check names what is missing so ops can fix it.
export async function getDeliveryReadiness(): Promise<{ checks: ReadinessCheck[]; allReady: boolean }> {
  const visible = { needsPriceReview: false, retired: false };
  const [classes, centres, unweighed, totalMaterials] = await Promise.all([
    prisma.vehicleClass.findMany({ where: { active: true }, select: { name: true, ratePerKm: true } }),
    prisma.fulfillmentCenter.findMany({ select: { name: true, latitude: true, longitude: true } }),
    prisma.material.count({ where: { ...visible, OR: [{ weightConfirmedAt: null }, { unitWeightKg: null }] } }),
    prisma.material.count({ where: visible }),
  ]);

  const unrated = classes.filter((c) => c.ratePerKm === null);
  const rated = classes.length - unrated.length;
  const unplaced = centres.filter((c) => c.latitude === null || c.longitude === null);
  const placed = centres.length - unplaced.length;

  const checks: ReadinessCheck[] = [
    {
      id: 'maps',
      label: 'Google Maps key',
      ready: isMapsConfigured(),
      detail: isMapsConfigured() ? 'Key is set.' : 'GOOGLE_MAPS_API_KEY is not set on the server.',
    },
    {
      id: 'rates',
      label: 'Vehicle rates per km',
      ready: rated > 0 && unrated.length === 0,
      detail: rated === 0 ? 'No vehicle class has a rate yet.' : unrated.length ? `Missing for ${unrated.map((c) => c.name).join(', ')}.` : `${rated} classes priced.`,
    },
    {
      id: 'centres',
      label: 'Fulfilment centre locations',
      ready: placed > 0 && unplaced.length === 0,
      detail: placed === 0 ? 'No centre has map coordinates.' : unplaced.length ? `Missing for ${unplaced.map((c) => c.name).join(', ')}.` : `${placed} centres placed.`,
    },
    {
      id: 'weights',
      label: 'Confirmed item weights',
      ready: totalMaterials > 0 && unweighed === 0,
      detail: unweighed === 0 ? `All ${totalMaterials} items confirmed.` : `${unweighed} of ${totalMaterials} items still need a confirmed weight.`,
    },
  ];
  return { checks, allReady: checks.every((c) => c.ready) };
}
