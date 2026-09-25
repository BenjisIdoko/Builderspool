// One-off: applies docs/price-research-2026-09.csv (High + Medium rows) and reprices stale existing items.
// Dry run by default:   npx tsx scripts/apply-price-research.ts
// Apply for real:       npx tsx scripts/apply-price-research.ts --apply
// Writes docs/price-research-2026-09-rollback.json (previous price, review flag, unit) before changing anything.
// Mirrors the admin price editor: a price change sets needsPriceReview=false and adds a PriceSnapshot row.
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
const p = new PrismaClient();
const APPLY = process.argv.includes('--apply');

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

(async () => {
  const rows = parseCsv(readFileSync('docs/price-research-2026-09.csv', 'utf8'));
  const h = rows[0]; const ix = (n: string) => h.indexOf(n);
  type Change = { id: string; name: string; price: number; reason: string; unit?: string };
  const UNITS: Record<string, string> = {
    'Reinforcement Bar (Rebar) — 8mm': '12m length', 'Reinforcement Bar (Rebar) — 10mm': '12m length', 'Reinforcement Bar (Rebar) — 12mm': '12m length', 'Reinforcement Bar (Rebar) — 16mm': '12m length',
    'Sandcrete Hollow Block — 6-inch': 'block', 'Sandcrete Hollow Block — 9-inch': 'block', 'Interlocking Stabilised Earth Block': 'block',
    'Long-Span Aluminium Roofing Sheet': 'm² (0.55mm)', 'Step-Tile Aluminium Roofing Sheet': 'm² (0.55mm)', 'Metcoppo Aluminium Roofing Sheet': 'm² (0.55mm)', 'Stone-Coated Steel Roofing Tile': 'm²',
  };
  const changes: Change[] = [];
  for (const r of rows.slice(1)) {
    const conf = r[ix('confidence')];
    if ((conf === 'High' || conf === 'Medium') && r[ix('proposed_price_ngn')]) {
      changes.push({ id: r[ix('material_id')], name: r[ix('name')], price: Number(r[ix('proposed_price_ngn')]), reason: `research ${conf}`, unit: UNITS[r[ix('name')]] });
    }
  }
  // Stale existing items, matched by exact name
  const stale: Record<string, number> = {
    'Dangote Cement 42.5R': 12500, 'BUA Cement 42.5R': 12000, 'Elephant Cement 42.5R': 12000,
    'Sandcrete Block, 6 inch': 750, 'Sandcrete Block, 9 inch': 1075, 'Hollow Block, 9 inch': 1075, 'Sandcrete Block, 5 inch': 650,
  };
  for (const [name, price] of Object.entries(stale)) {
    const m = await p.material.findFirst({ where: { name } });
    if (m) changes.push({ id: m.id, name, price, reason: 'stale existing price' });
    else console.log('NOT FOUND (stale list):', name);
  }
  const before: { id: string; name: string; catalogPrice: number; needsPriceReview: boolean; unit: string }[] = [];
  for (const c of changes) {
    const m = await p.material.findUnique({ where: { id: c.id }, select: { name: true, catalogPrice: true, needsPriceReview: true, unit: true } });
    if (!m) { console.log('MISSING id', c.id, c.name); continue; }
    before.push({ id: c.id, name: m.name, catalogPrice: Number(m.catalogPrice), needsPriceReview: m.needsPriceReview, unit: m.unit });
    console.log(`${APPLY ? 'APPLY' : 'DRY '} ${m.name}: ₦${Number(m.catalogPrice).toLocaleString()} -> ₦${c.price.toLocaleString()} (${c.reason})${c.unit ? ` unit: "${m.unit}" -> "${c.unit}"` : ''}`);
  }
  // Ashaka: no source -> hide until verified rather than leave a stale price live
  const ash = await p.material.findFirst({ where: { name: 'Ashaka Cement 32.5R' } });
  if (ash) { before.push({ id: ash.id, name: ash.name, catalogPrice: Number(ash.catalogPrice), needsPriceReview: ash.needsPriceReview, unit: ash.unit }); console.log(`${APPLY ? 'APPLY' : 'DRY '} ${ash.name}: flag needsPriceReview=true (no source)`); }
  if (!APPLY) { console.log(`\nDry run: ${changes.length} price changes + 1 flag. Re-run with --apply.`); return; }
  writeFileSync('docs/price-research-2026-09-rollback.json', JSON.stringify(before, null, 1));
  await p.$transaction([
    ...changes.map((c) => p.material.update({ where: { id: c.id }, data: { catalogPrice: c.price, needsPriceReview: false, ...(c.unit ? { unit: c.unit } : {}) } })),
    ...changes.map((c) => p.priceSnapshot.create({ data: { materialId: c.id, price: c.price } })),
    ...(ash ? [p.material.update({ where: { id: ash.id }, data: { needsPriceReview: true } })] : []),
  ]);
  console.log(`\nApplied ${changes.length} price changes + Ashaka flag. Rollback file written.`);
})().finally(() => p.$disconnect());
