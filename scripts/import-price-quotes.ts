// Turns filled-in supplier quotes into catalogue prices.
//   Dry run (default):  npx tsx scripts/import-price-quotes.ts
//   Apply:              npx tsx scripts/import-price-quotes.ts --apply
//   Options:            --file=<path>      CSV to read (default docs/rfq/price-quotes-template-2026-09.csv)
//                       --min-quotes=<n>   quotes required when no final price is given (default 2)
//
// Per row: price = final_catalogue_price_ngn if filled, otherwise the MEDIAN of quote_1..3. A row is
// skipped (and reported, never guessed) when it has too few quotes, a non-numeric value, or a price
// far outside the reference range (below half the low or above double the high) — fix the typo or
// type the price into final_catalogue_price_ngn to confirm it on purpose.
// Applying mirrors the admin price editor: catalogPrice set, needsPriceReview=false (publishes the
// item), a PriceSnapshot row, and the unit rewritten to the unit that was quoted ("per 12m length"
// -> "12m length"). Previous values are written to docs/rfq/import-rollback-<timestamp>.json first.
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';

const p = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FILE = args.find((a) => a.startsWith('--file='))?.slice(7) ?? 'docs/rfq/price-quotes-template-2026-09.csv';
const MIN_QUOTES = Number(args.find((a) => a.startsWith('--min-quotes='))?.slice(13) ?? 2);

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
const num = (s: string) => { const t = s.replace(/[₦,\s]/g, ''); return t === '' ? null : Number(t); };
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

(async () => {
  const rows = parseCsv(readFileSync(FILE, 'utf8'));
  const h = rows[0]; const ix = (n: string) => h.indexOf(n);
  const ready: { id: string; name: string; price: number; unit: string; basis: string }[] = [];
  const skipped: string[] = [];
  let untouched = 0;

  for (const r of rows.slice(1)) {
    if (!r[0]) continue;
    const name = r[ix('item')];
    const quotes = ['quote_1_ngn', 'quote_2_ngn', 'quote_3_ngn'].map((c) => r[ix(c)]).filter((v) => v.trim() !== '');
    const finalRaw = r[ix('final_catalogue_price_ngn')];
    if (quotes.length === 0 && finalRaw.trim() === '') { untouched++; continue; }

    const nums = quotes.map(num);
    if (nums.some((n) => n === null || !Number.isFinite(n) || (n as number) <= 0) || (finalRaw.trim() !== '' && !(Number(num(finalRaw)) > 0))) {
      skipped.push(`${name}: a quote or the final price is not a positive number`); continue;
    }
    const finalPrice = finalRaw.trim() !== '' ? (num(finalRaw) as number) : null;
    if (finalPrice === null && nums.length < MIN_QUOTES) { skipped.push(`${name}: only ${nums.length} quote(s); need ${MIN_QUOTES} (or type a final price)`); continue; }
    const price = finalPrice ?? median(nums as number[]);
    const lo = num(r[ix('reference_low_ngn')]); const hi = num(r[ix('reference_high_ngn')]);
    if (finalPrice === null && lo && hi && (price < lo * 0.5 || price > hi * 2)) {
      skipped.push(`${name}: ₦${price.toLocaleString()} is far outside the reference ₦${lo.toLocaleString()}-${hi.toLocaleString()} — check units/typo, or confirm in final_catalogue_price_ngn`); continue;
    }
    const quoteUnit = r[ix('quote_per')].replace(/^per\s+/i, '').trim();
    ready.push({ id: r[0], name, price, unit: quoteUnit, basis: finalPrice !== null ? 'final price' : `median of ${nums.length} quotes` });
  }

  const before: unknown[] = [];
  for (const c of ready) {
    const m = await p.material.findUnique({ where: { id: c.id }, select: { name: true, catalogPrice: true, unit: true, needsPriceReview: true } });
    if (!m) { skipped.push(`${c.name}: material id not found`); continue; }
    before.push({ id: c.id, name: m.name, catalogPrice: Number(m.catalogPrice), unit: m.unit, needsPriceReview: m.needsPriceReview });
    console.log(`${APPLY ? 'APPLY' : 'DRY  '} ${c.name}: ₦${Number(m.catalogPrice).toLocaleString()} -> ₦${c.price.toLocaleString()} / ${c.unit}  (${c.basis})`);
  }
  console.log(`\n${ready.length} ready, ${skipped.length} skipped, ${untouched} rows with no quotes yet.`);
  for (const s of skipped) console.log('SKIPPED', s);
  if (!APPLY) { console.log('\nDry run only. Re-run with --apply to write.'); return; }
  if (ready.length === 0) return;

  writeFileSync(`docs/rfq/import-rollback-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify(before, null, 1));
  await p.$transaction([
    ...ready.map((c) => p.material.update({ where: { id: c.id }, data: { catalogPrice: c.price, unit: c.unit, needsPriceReview: false } })),
    ...ready.map((c) => p.priceSnapshot.create({ data: { materialId: c.id, price: c.price } })),
  ]);
  console.log(`Applied ${ready.length} prices. Rollback file written.`);
})().finally(() => p.$disconnect());
