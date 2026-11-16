// One-off: fills in ESTIMATED weights so ops has something to check instead of typing from scratch.
// Run only after migration 20261116100000_add_delivery_pricing is applied.
// Dry run by default:   npx tsx scripts/prefill-material-weights.ts
// Apply for real:       npx tsx scripts/prefill-material-weights.ts --apply
// Only touches materials with no weight yet, and never sets weightConfirmedAt: an estimate does not price delivery
// until ops confirms it on Admin > Delivery pricing.
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const APPLY = process.argv.includes('--apply');

type Estimate = { kg: number; longestM?: number; why: string };

function estimate(name: string, category: string): Estimate | null {
  const n = name.toLowerCase();
  if (category === 'Cement & Binders') return { kg: 50, why: '50 kg bag' };
  if (n.includes('rebar')) {
    const mm = n.match(/(\d+)mm/)?.[1];
    const perMetre: Record<string, number> = { '8': 0.395, '10': 0.617, '12': 0.888, '16': 1.578, '20': 2.466 };
    return mm && perMetre[mm] ? { kg: Math.round(perMetre[mm] * 12 * 100) / 100, longestM: 12, why: `${mm}mm steel, ${perMetre[mm]} kg per metre x 12 m` } : null;
  }
  if (n.includes('hollow block') && n.includes('6')) return { kg: 20, why: '6-inch hollow sandcrete, typical' };
  if (n.includes('hollow block') && n.includes('9')) return { kg: 28, why: '9-inch hollow sandcrete, typical' };
  if (n.includes('solid block')) return { kg: 26, why: '5-inch solid sandcrete, typical' };
  if (n.includes('interlocking')) return { kg: 8, why: 'stabilised earth block, typical' };
  if (n.includes('conduit')) return { kg: n.includes('25mm') ? 0.4 : 0.3, longestM: 3, why: 'PVC conduit, 3 m length' };
  if (n.includes('fitting')) return { kg: 0.02, why: 'small PVC fitting' };
  if (category === 'Paints & Coatings') {
    const kg = n.includes('textured') ? 35 : n.includes('gloss') ? 22 : 28;
    return { kg, why: '20 L drum. The unit reads "Litre / Drum", so check whether a unit is one litre or one drum' };
  }
  if (n.includes('aluminium')) return { kg: 1.5, why: '0.55 mm aluminium sheet, per m². Longest side depends on sheet length' };
  if (n.includes('stone-coated')) return { kg: 5, why: 'stone-coated steel tile, per m². Longest side depends on sheet length' };
  return null;
}

(async () => {
  const rows = await p.material.findMany({
    where: { needsPriceReview: false, retired: false, unitWeightKg: null },
    select: { id: true, name: true, category: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  let set = 0;
  for (const r of rows) {
    const e = estimate(r.name, r.category);
    if (!e) {
      console.log(`SKIP  ${r.name}: no estimate`);
      continue;
    }
    console.log(`${APPLY ? 'SET ' : 'WOULD'} ${r.name}: ${e.kg} kg${e.longestM ? `, ${e.longestM} m` : ''} (${e.why})`);
    if (APPLY) await p.material.update({ where: { id: r.id }, data: { unitWeightKg: e.kg, longestSideM: e.longestM ?? null } });
    set++;
  }
  console.log(`${set} of ${rows.length} materials ${APPLY ? 'updated' : 'would be updated'}. None are confirmed.`);
  await p.$disconnect();
})();
