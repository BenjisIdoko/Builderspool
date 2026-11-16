import { straightLineKm } from './plan';

export type LatLng = { lat: number; lng: number };

export const isMapsConfigured = () => Boolean(process.env.GOOGLE_MAPS_API_KEY);

/** The centre nearest to a point by straight line. Used only to choose where the goods ship from. */
export function nearestCentre<T extends LatLng>(to: LatLng, centres: T[]): T | null {
  let best: T | null = null;
  let bestKm = Infinity;
  for (const c of centres) {
    const km = straightLineKm(to, c);
    if (km < bestKm) {
      best = c;
      bestKm = km;
    }
  }
  return best;
}

/**
 * Road distance in km from Google's Routes API. Returns null when there is no key or the lookup fails, so the
 * caller can fall back to the zone fee. Never guesses a distance.
 */
export async function roadDistanceKm(origin: LatLng, destination: LatLng): Promise<number | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.distanceMeters' },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: { distanceMeters?: number }[] };
    const meters = data.routes?.[0]?.distanceMeters;
    return typeof meters === 'number' && meters >= 0 ? Math.round(meters / 100) / 10 : null;
  } catch {
    return null;
  }
}
