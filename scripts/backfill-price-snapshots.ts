import { prisma } from '../lib/prisma';

// One-off: every existing Material predates PriceSnapshot and has never had
// its catalogPrice changed (no materials-CRUD UI exists yet), so "the price
// has been what it is since the material was created" is a true statement,
// not a fabricated one. Backfills exactly that.
async function main() {
  const materials = await prisma.material.findMany({
    include: { _count: { select: { priceSnapshots: true } } },
  });

  let created = 0;
  for (const material of materials) {
    if (material._count.priceSnapshots > 0) continue;
    await prisma.priceSnapshot.create({
      data: {
        materialId: material.id,
        price: material.catalogPrice,
        recordedAt: material.createdAt,
      },
    });
    created++;
  }

  console.log(`Backfilled ${created} price snapshot(s) across ${materials.length} material(s).`);
}

main().finally(() => prisma.$disconnect());
