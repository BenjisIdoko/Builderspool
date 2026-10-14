export type NameMatch = 'MATCH' | 'PARTIAL' | 'MISMATCH';

// Legal-form and filler words that don't distinguish one business from
// another ("Dangote Materials Ltd" vs "Dangote Materials Limited").
const NOISE = new Set([
  'ltd', 'limited', 'plc', 'llc', 'inc', 'co', 'company', 'nig', 'nigeria', 'the', 'and', 'of', 'enterprises',
  'enterprise', 'ventures', 'venture', 'global', 'services', 'service', 'group', 'int', 'intl', 'international',
]);

function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NOISE.has(t));
}

// Advisory only: compares the account's business name with the name the CAC
// registry returned, to flag a likely wrong or someone else's registration
// number for the human reviewer. It never approves or rejects anything.
export function compareBusinessNames(accountName: string, registryName: string): NameMatch {
  const a = significantTokens(accountName);
  const b = significantTokens(registryName);
  if (a.length === 0 || b.length === 0) return 'MISMATCH';

  const setB = new Set(b);
  const shared = a.filter((t) => setB.has(t)).length;

  if (shared === a.length && shared === b.length) return 'MATCH';
  // One name wholly contained in the other ("Lekki Rebar" vs "Lekki Rebar Mills").
  if (shared === Math.min(a.length, b.length)) return 'PARTIAL';
  return shared > 0 ? 'PARTIAL' : 'MISMATCH';
}
