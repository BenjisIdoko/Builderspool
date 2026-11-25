import type { LatLng } from './distance';
import { isInNigeria } from './distance';

// Address search for the checkout, through Google Places (New). The browser never sees the key: it asks our own
// routes, which call Google from the server. Every function returns null when there is no key or Google fails, so
// the checkout can fall back to the zone fee instead of breaking.

export type PlaceSuggestion = { placeId: string; main: string; secondary: string };
export type PlaceSite = LatLng & { address: string };

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
const SESSION = /^[A-Za-z0-9-]{8,64}$/;

export const isValidPlaceId = (id: unknown): id is string => typeof id === 'string' && PLACE_ID.test(id);
const cleanSession = (token: unknown) => (typeof token === 'string' && SESSION.test(token) ? token : undefined);

export async function autocompletePlaces(query: string, sessionToken?: unknown): Promise<PlaceSuggestion[] | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const input = query.trim().slice(0, 120);
  if (input.length < 3) return [];
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify({ input, includedRegionCodes: ['ng'], languageCode: 'en', sessionToken: cleanSession(sessionToken) }),
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      suggestions?: {
        placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } };
      }[];
    };
    const out: PlaceSuggestion[] = [];
    for (const s of data.suggestions ?? []) {
      const p = s.placePrediction;
      if (!p || !isValidPlaceId(p.placeId) || !p.structuredFormat?.mainText?.text) continue;
      out.push({ placeId: p.placeId, main: p.structuredFormat.mainText.text, secondary: p.structuredFormat.secondaryText?.text ?? '' });
    }
    return out.slice(0, 6);
  } catch {
    return null;
  }
}

/** Where a chosen suggestion is on the map. Null if Google fails or the point is outside Nigeria. */
export async function placeSite(placeId: string, sessionToken?: unknown): Promise<PlaceSite | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !isValidPlaceId(placeId)) return null;
  const token = cleanSession(sessionToken);
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}${token ? `?sessionToken=${token}` : ''}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'location,formattedAddress' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { location?: { latitude?: number; longitude?: number }; formattedAddress?: string };
    const lat = data.location?.latitude;
    const lng = data.location?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !isInNigeria({ lat, lng })) return null;
    return { lat, lng, address: data.formattedAddress ?? '' };
  } catch {
    return null;
  }
}
