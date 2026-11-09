// Map links built from a place's address, so they need no API key and no stored coordinates.
// An embedded map needs coordinates (see the follow-up that stores them on the centre), so
// for now buyers open the place in their maps app.

/** Opens turn-by-turn directions to the address in the Maps app or site. */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Shows the address on OpenStreetMap, a second option that needs no account. */
export function viewOnMapUrl(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}
