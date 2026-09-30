// One-off: corrects scripts/retire-duplicate-materials.ts's original choice — it
// reused needsPriceReview to hide 15 superseded duplicate rows, which put them in
// the admin "needs price review" queue even though they were never awaiting a
// price. Moves them onto the real `retired` flag instead (needsPriceReview: false,
// retired: true) so they're accurately labelled and drop out of that queue, while
// staying hidden from buyers (BUYER_VISIBLE now excludes retired too) and visible
// to admin as "Retired". Does not touch Ashaka Cement 32.5R or any of the other
// 110 rows still genuinely awaiting a real price — those keep needsPriceReview.
//
// Dry run by default:   npx tsx scripts/backfill-retired-materials.ts
// Apply for real:       npx tsx scripts/backfill-retired-materials.ts --apply
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const p = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const RETIRE_NAMES = [
  'Dangote Cement 42.5R', 'BUA Cement 42.5R', 'Elephant Cement 42.5R',
  'Sandcrete Block, 5 inch', 'Sandcrete Block, 6 inch', 'Sandcrete Block, 9 inch', 'Hollow Block, 9 inch',
  'Reinforcement Rod, 10mm', 'Reinforcement Rod, 12mm', 'Reinforcement Rod, 16mm', 'Reinforcement Rod, 20mm',
  'Aluminium Roofing Sheet, 0.55mm', 'Step Tile Roofing Sheet', 'Stone-Coated Roofing Tile', 'Zinc Aluminium Roofing Sheet, 0.45mm',
];

(async () => {
  const rows = await p.material.findMany({ where: { name: { in: RETIRE_NAMES } }, select: { id: true, name: true, needsPriceReview: true, retired: true } });
  const missing = RETIRE_NAMES.filter((n) => !rows.find((r) => r.name === n));
  if (missing.length) console.log('NOT FOUND:', missing.join(' | '));

  const toFix = rows.filter((r) => !r.retired || r.needsPriceReview);
  for (const r of toFix) {
    console.log(`${APPLY ? 'APPLY' : 'DRY  '} ${r.name}: needsPriceReview ${r.needsPriceReview}->false, retired ${r.retired}->true`);
  }
  console.log(`\n${toFix.length} of ${rows.length} rows need fixing (rest already correct — safe to re-run).`);
  if (!APPLY) { console.log('Dry run only. Re-run with --apply to write.'); return; }
  if (toFix.length === 0) return;

  writeFileSync(
    'docs/rfq/backfill-retired-rollback.json',
    JSON.stringify(toFix.map((r) => ({ id: r.id, name: r.name, needsPriceReview: r.needsPriceReview, retired: r.retired })), null, 1),
  );
  await p.material.updateMany({ where: { id: { in: toFix.map((r) => r.id) } }, data: { needsPriceReview: false, retired: true } });
  console.log(`Applied. Rollback file written.`);
})().finally(() => p.$disconnect());
