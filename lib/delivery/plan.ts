// Delivery pricing, as pure functions so every rule can be tested without a database or a maps service.
//
// 1. Add up the load (quantity x weight per unit) and find the longest single item.
// 2. Choose vehicles: the smallest class that can carry the load and the length. A load bigger than the biggest
//    class is split into trips: full trips in the biggest class, then the smallest class that fits what is left.
// 3. Price each trip as base fare + rate per km x distance, add the trips, and round up to the rounding step.
//
// Money is whole naira. The business sets the base fare, each class's rate per km and the rounding step.

export type VehicleClassInfo = {
  id: string;
  name: string;
  maxLoadKg: number;
  maxLengthM: number | null; // longest item it can carry; null means no limit
  ratePerKm: number | null; // null means the business has not set a rate, so the class is not used
  sortOrder: number;
  active: boolean;
};

export type LoadLine = {
  name: string;
  quantity: number;
  unitWeightKg: number | null;
  longestSideM: number | null;
};

export type Load = { totalKg: number; longestSideM: number; missingWeight: string[] };

/** The weight of the whole order and its longest item. Items with no weight are listed, never guessed. */
export function summariseLoad(lines: LoadLine[]): Load {
  let totalKg = 0;
  let longestSideM = 0;
  const missingWeight: string[] = [];
  for (const l of lines) {
    if (l.unitWeightKg === null || !(l.unitWeightKg >= 0)) {
      missingWeight.push(l.name);
      continue;
    }
    totalKg += l.unitWeightKg * l.quantity;
    if (l.longestSideM !== null && l.longestSideM > longestSideM) longestSideM = l.longestSideM;
  }
  return { totalKg: Math.round(totalKg * 1000) / 1000, longestSideM, missingWeight };
}

export type Trip = { vehicleId: string; vehicleName: string; loadKg: number; ratePerKm: number };

export type TripPlan = { ok: true; trips: Trip[] } | { ok: false; reason: 'NO_VEHICLE' | 'EMPTY_LOAD' | 'TOO_LONG'; message: string };

export function planTrips(load: Pick<Load, 'totalKg' | 'longestSideM'>, classes: VehicleClassInfo[]): TripPlan {
  if (!(load.totalKg > 0)) return { ok: false, reason: 'EMPTY_LOAD', message: 'There is nothing to carry.' };

  // Only classes that are switched on and have a rate can be used.
  const usable = classes.filter((c) => c.active && c.ratePerKm !== null).sort((a, b) => a.maxLoadKg - b.maxLoadKg || a.sortOrder - b.sortOrder);
  if (usable.length === 0) return { ok: false, reason: 'NO_VEHICLE', message: 'No vehicle class is set up for delivery.' };

  const fitsLength = usable.filter((c) => c.maxLengthM === null || c.maxLengthM >= load.longestSideM);
  if (fitsLength.length === 0) {
    return { ok: false, reason: 'TOO_LONG', message: `No vehicle can carry an item ${load.longestSideM} m long.` };
  }

  const biggest = fitsLength[fitsLength.length - 1];
  const trips: Trip[] = [];
  let left = load.totalKg;
  while (left > biggest.maxLoadKg) {
    trips.push({ vehicleId: biggest.id, vehicleName: biggest.name, loadKg: biggest.maxLoadKg, ratePerKm: biggest.ratePerKm as number });
    left -= biggest.maxLoadKg;
  }
  const last = fitsLength.find((c) => c.maxLoadKg >= left) ?? biggest;
  trips.push({ vehicleId: last.id, vehicleName: last.name, loadKg: Math.round(left * 1000) / 1000, ratePerKm: last.ratePerKm as number });
  return { ok: true, trips };
}

export type PricedTrip = Trip & { fee: number };
export type Pricing = { trips: PricedTrip[]; subtotal: number; fee: number; distanceKm: number; baseFare: number; roundTo: number };

/** Base fare + rate per km x distance, per trip. The total is rounded up to the next `roundTo` naira. */
export function priceTrips(trips: Trip[], distanceKm: number, baseFare: number, roundTo: number): Pricing {
  const priced = trips.map((t) => ({ ...t, fee: Math.round(baseFare + t.ratePerKm * distanceKm) }));
  const subtotal = priced.reduce((sum, t) => sum + t.fee, 0);
  const step = roundTo > 0 ? roundTo : 1;
  return { trips: priced, subtotal, fee: Math.ceil(subtotal / step) * step, distanceKm, baseFare, roundTo: step };
}

/** Straight-line distance in km, used only to find the nearest centre. The fee uses road distance. */
export function straightLineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
