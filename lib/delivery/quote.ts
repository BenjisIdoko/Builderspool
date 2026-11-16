import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { nearestCentre, roadDistanceKm, type LatLng } from './distance';
import { planTrips, priceTrips, summariseLoad, type VehicleClassInfo } from './plan';

export type QuoteLine = { materialId: string; quantity: number };

export type DeliveryQuote = {
  version: 1;
  centreId: string;
  centreName: string;
  distanceKm: number;
  totalKg: number;
  longestSideM: number;
  trips: { vehicleName: string; loadKg: number; fee: number }[];
  baseFare: number;
  roundTo: number;
  subtotal: number;
  fee: number;
  computedAt: string;
};

export type QuoteResult =
  | { ok: true; quote: DeliveryQuote }
  | { ok: false; reason: 'DISABLED' | 'NO_WEIGHT' | 'NO_CENTRE' | 'NO_DISTANCE' | 'NO_VEHICLE'; message: string };

/**
 * Delivery fee from load, vehicle and distance. Returns ok:false (never a guess) whenever any input is missing, so
 * the caller falls back to the zone or region fee.
 */
export async function quoteDelivery(lines: QuoteLine[], destination: LatLng): Promise<QuoteResult> {
  const settings = await getSettings();
  if (!settings['delivery.distancePricingEnabled']) {
    return { ok: false, reason: 'DISABLED', message: 'Distance pricing is off.' };
  }

  const materials = await prisma.material.findMany({
    where: { id: { in: lines.map((l) => l.materialId) } },
    select: { id: true, name: true, unitWeightKg: true, longestSideM: true, weightConfirmedAt: true },
  });
  const byId = new Map(materials.map((m) => [m.id, m]));
  const load = summariseLoad(
    lines.map((l) => {
      const m = byId.get(l.materialId);
      // An estimate that nobody has confirmed is treated as missing, so no fee is built on a guess.
      const usable = m && m.weightConfirmedAt && m.unitWeightKg !== null;
      return {
        name: m?.name ?? l.materialId,
        quantity: l.quantity,
        unitWeightKg: usable ? Number(m.unitWeightKg) : null,
        longestSideM: usable && m.longestSideM !== null ? Number(m.longestSideM) : null,
      };
    }),
  );
  if (load.missingWeight.length > 0) {
    return { ok: false, reason: 'NO_WEIGHT', message: `No confirmed weight for ${load.missingWeight.join(', ')}.` };
  }

  const centres = (await prisma.fulfillmentCenter.findMany({ select: { id: true, name: true, latitude: true, longitude: true } }))
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({ id: c.id, name: c.name, lat: c.latitude as number, lng: c.longitude as number }));
  const centre = nearestCentre(destination, centres);
  if (!centre) return { ok: false, reason: 'NO_CENTRE', message: 'No fulfilment centre has map coordinates.' };

  const classRows = await prisma.vehicleClass.findMany();
  const classes: VehicleClassInfo[] = classRows.map((c) => ({
    id: c.id,
    name: c.name,
    maxLoadKg: c.maxLoadKg,
    maxLengthM: c.maxLengthM === null ? null : Number(c.maxLengthM),
    ratePerKm: c.ratePerKm === null ? null : Number(c.ratePerKm),
    sortOrder: c.sortOrder,
    active: c.active,
  }));
  const plan = planTrips(load, classes);
  if (!plan.ok) return { ok: false, reason: 'NO_VEHICLE', message: plan.message };

  const distanceKm = await roadDistanceKm(centre, destination);
  if (distanceKm === null) return { ok: false, reason: 'NO_DISTANCE', message: 'The distance could not be measured.' };

  const priced = priceTrips(plan.trips, distanceKm, Number(settings['delivery.baseFare']), Number(settings['delivery.roundTo']));
  return {
    ok: true,
    quote: {
      version: 1,
      centreId: centre.id,
      centreName: centre.name,
      distanceKm,
      totalKg: load.totalKg,
      longestSideM: load.longestSideM,
      trips: priced.trips.map((t) => ({ vehicleName: t.vehicleName, loadKg: t.loadKg, fee: t.fee })),
      baseFare: priced.baseFare,
      roundTo: priced.roundTo,
      subtotal: priced.subtotal,
      fee: priced.fee,
      computedAt: new Date().toISOString(),
    },
  };
}
