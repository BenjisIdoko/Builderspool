// One-off: retire the older duplicate catalogue rows and keep the researched copies.
// Dry run by default:   npx tsx scripts/retire-duplicate-materials.ts
// Apply for real:       npx tsx scripts/retire-duplicate-materials.ts --apply
//
// "Retire" = hide from buyers via needsPriceReview (the rows are referenced by real
// orders, bids and bid cycles, so they can't be deleted). Before hiding, each legacy row's
// product photo is copied onto its researched twin so the storefront doesn't lose its only
// photographs. Two twins that were still hidden take over the price their legacy row
// already had live (5-inch solid block ₦650, 20mm rebar ₦24,500), so nothing new is priced.
// Writes docs/duplicates-retired-2026-09-rollback.json before changing anything.
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';
const p = new PrismaClient();
const APPLY = process.argv.includes('--apply');

// Legacy rows to hide (exact names).
const RETIRE = [
  'Dangote Cement 42.5R', 'BUA Cement 42.5R', 'Elephant Cement 42.5R',
  'Sandcrete Block, 5 inch', 'Sandcrete Block, 6 inch', 'Sandcrete Block, 9 inch', 'Hollow Block, 9 inch',
  'Reinforcement Rod, 10mm', 'Reinforcement Rod, 12mm', 'Reinforcement Rod, 16mm', 'Reinforcement Rod, 20mm',
  'Aluminium Roofing Sheet, 0.55mm', 'Step Tile Roofing Sheet', 'Stone-Coated Roofing Tile', 'Zinc Aluminium Roofing Sheet, 0.45mm',
];
// Researched twins that are still hidden and inherit the legacy row's live price.
const PUBLISH: { name: string; price: number; unit: string }[] = [
  { name: 'Sandcrete Solid Block — 5-inch', price: 650, unit: 'block' },
  { name: 'Reinforcement Bar (Rebar) — 20mm', price: 24500, unit: '12m length' },
];
// Which visible researched rows get the legacy category photo if they have none.
const PHOTO_TARGETS: { image: string; category: string; nameHas?: string; nameNot?: string }[] = [
  { image: '/materials/cement.jpg', category: 'Cement & Binders', nameHas: 'Cement' },
  { image: '/materials/blocks.jpg', category: 'Blocks, Bricks & Masonry', nameNot: 'Interlocking' }, // a sandcrete photo would mislead on an earth block
  { image: '/materials/rebar.jpg', category: 'Reinforcement & Structural Steel', nameHas: 'Reinforcement Bar' },
];

(async () => {
  const before: Record<string, unknown>[] = [];
  const snap = (m: { id: string; name: string; catalogPrice: unknown; unit: string; needsPriceReview: boolean; imageUrl: string | null; images: string[] }) =>
    before.push({ id: m.id, name: m.name, catalogPrice: Number(m.catalogPrice), unit: m.unit, needsPriceReview: m.needsPriceReview, imageUrl: m.imageUrl, images: m.images });

  const retire = await p.material.findMany({ where: { name: { in: RETIRE } } });
  const missing = RETIRE.filter((n) => !retire.find((r) => r.name === n));
  if (missing.length) console.log('NOT FOUND:', missing.join(' | '));
  for (const r of retire) { snap(r); console.log(`${APPLY ? 'APPLY' : 'DRY  '} hide: ${r.name} (${r.category}, ₦${Number(r.catalogPrice).toLocaleString()})`); }

  const publish = [];
  for (const t of PUBLISH) {
    const m = await p.material.findFirst({ where: { name: t.name } });
    if (!m) { console.log('NOT FOUND:', t.name); continue; }
    snap(m); publish.push({ m, t });
    console.log(`${APPLY ? 'APPLY' : 'DRY  '} publish: ${m.name} ₦${Number(m.catalogPrice).toLocaleString()} -> ₦${t.price.toLocaleString()} / ${t.unit}`);
  }

  const photoRows: { id: string; image: string; name: string }[] = [];
  for (const pt of PHOTO_TARGETS) {
    const rows = await p.material.findMany({ where: { category: pt.category, imageUrl: null, ...(pt.nameHas || pt.nameNot ? { name: { ...(pt.nameHas ? { contains: pt.nameHas } : {}), ...(pt.nameNot ? { not: { contains: pt.nameNot } } : {}) } } : {}) } });
    for (const m of rows) {
      const willBeVisible = !m.needsPriceReview || PUBLISH.some((x) => x.name === m.name);
      if (!willBeVisible) continue;
      if (!before.find((b) => b.id === m.id)) snap(m);
      photoRows.push({ id: m.id, image: pt.image, name: m.name });
      console.log(`${APPLY ? 'APPLY' : 'DRY  '} photo: ${m.name} <- ${pt.image}`);
    }
  }

  if (!APPLY) { console.log(`\nDry run: hide ${retire.length}, publish ${publish.length}, add photo to ${photoRows.length}. Re-run with --apply.`); return; }
  writeFileSync('docs/duplicates-retired-2026-09-rollback.json', JSON.stringify(before, null, 1));
  await p.$transaction([
    ...retire.map((r) => p.material.update({ where: { id: r.id }, data: { needsPriceReview: true } })),
    ...publish.map(({ m, t }) => p.material.update({ where: { id: m.id }, data: { catalogPrice: t.price, unit: t.unit, needsPriceReview: false } })),
    ...publish.map(({ m, t }) => p.priceSnapshot.create({ data: { materialId: m.id, price: t.price } })),
    ...photoRows.map((r) => p.material.update({ where: { id: r.id }, data: { imageUrl: r.image, images: [r.image] } })),
  ]);
  console.log(`\nApplied: hid ${retire.length}, published ${publish.length}, photos ${photoRows.length}. Rollback file written.`);
})().finally(() => p.$disconnect());
