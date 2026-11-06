// Creates the suggested service areas (State, LGAs, localities, delivery
// zones) if they do not exist yet. Idempotent: it never overwrites or deletes
// anything, and it sets no delivery fees (the business enters those in admin).
//
//   npm run seed-areas
import { PrismaClient } from '@prisma/client';
import { SEED_LGAS, SEED_LOCALITIES, SEED_STATE, SEED_ZONES } from '../lib/areas/seed-data';

const prisma = new PrismaClient();

async function main() {
  const state = await prisma.state.upsert({ where: { name: SEED_STATE }, update: {}, create: { name: SEED_STATE } });

  const lgaIds = new Map<string, string>();
  for (const name of SEED_LGAS) {
    const lga = await prisma.lga.upsert({
      where: { stateId_name: { stateId: state.id, name } },
      update: {},
      create: { stateId: state.id, name },
    });
    lgaIds.set(name, lga.id);
  }

  const zoneIds = new Map<string, string>();
  for (const name of SEED_ZONES) {
    const zone = await prisma.deliveryZone.upsert({ where: { name }, update: {}, create: { name } });
    zoneIds.set(name, zone.id);
  }

  let created = 0;
  for (const loc of SEED_LOCALITIES) {
    const lgaId = lgaIds.get(loc.lga)!;
    const existing = await prisma.locality.findUnique({ where: { lgaId_name: { lgaId, name: loc.name } } });
    if (existing) continue;
    await prisma.locality.create({
      data: { lgaId, name: loc.name, kind: loc.kind, zoneId: loc.zone ? zoneIds.get(loc.zone)! : null },
    });
    created++;
  }

  console.log(`State ${state.name}: ${lgaIds.size} LGAs, ${zoneIds.size} zones, ${created} new localities.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
