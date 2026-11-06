// Suggested starting service areas (docs/floot-port-notes.md 2.11). Ops confirm
// every row; the seed only creates what is missing and never overwrites an
// edit, so re-running it is safe.
export const SEED_STATE = 'FCT';

export const SEED_LGAS = ['AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji'] as const;

export const SEED_ZONES = [
  'AMAC – Lugbe / Airport Road corridor',
  'AMAC – Nyanya / Karu / Jikwoyi corridor',
  'AMAC – Lokogoma / Wumba / Kabusa corridor',
  'Bwari Area Council',
  'Gwagwalada Area Council',
] as const;

type Kind = 'CITY' | 'TOWN' | 'DISTRICT';

// zone: null = not in any zone yet (no delivery until ops assign one).
export const SEED_LOCALITIES: { lga: (typeof SEED_LGAS)[number]; name: string; kind: Kind; zone: (typeof SEED_ZONES)[number] | null }[] = [
  { lga: 'AMAC', name: 'Lugbe', kind: 'DISTRICT', zone: SEED_ZONES[0] },
  { lga: 'AMAC', name: 'Airport Road', kind: 'DISTRICT', zone: SEED_ZONES[0] },
  { lga: 'AMAC', name: 'Nyanya', kind: 'DISTRICT', zone: SEED_ZONES[1] },
  { lga: 'AMAC', name: 'Jikwoyi', kind: 'DISTRICT', zone: SEED_ZONES[1] },
  { lga: 'AMAC', name: 'Lokogoma', kind: 'DISTRICT', zone: SEED_ZONES[2] },
  { lga: 'AMAC', name: 'Wumba', kind: 'DISTRICT', zone: SEED_ZONES[2] },
  { lga: 'AMAC', name: 'Kabusa', kind: 'DISTRICT', zone: SEED_ZONES[2] },
  ...['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Jabi', 'Utako', 'Gwarinpa', 'Apo'].map((name) => ({
    lga: 'AMAC' as const,
    name,
    kind: 'DISTRICT' as Kind,
    zone: null,
  })),
  { lga: 'Bwari', name: 'Bwari town', kind: 'TOWN', zone: SEED_ZONES[3] },
  { lga: 'Bwari', name: 'Ushafa', kind: 'DISTRICT', zone: SEED_ZONES[3] },
  { lga: 'Bwari', name: 'Kubwa', kind: 'DISTRICT', zone: SEED_ZONES[3] },
  { lga: 'Bwari', name: 'Dutse', kind: 'DISTRICT', zone: SEED_ZONES[3] },
  { lga: 'Gwagwalada', name: 'Gwagwalada town', kind: 'TOWN', zone: SEED_ZONES[4] },
  { lga: 'Kuje', name: 'Kuje town', kind: 'TOWN', zone: null },
  { lga: 'Kwali', name: 'Kwali town', kind: 'TOWN', zone: null },
  { lga: 'Abaji', name: 'Abaji town', kind: 'TOWN', zone: null },
];
