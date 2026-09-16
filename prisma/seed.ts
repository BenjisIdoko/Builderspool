import { PrismaClient, Role, SourcingScope } from '@prisma/client';
import { DEMO_BUYER_EMAIL } from '../lib/demoBuyer';
import { DEMO_ADMIN_EMAIL } from '../lib/demoAdmin';

const prisma = new PrismaClient();

// Regions match the flat-rate keys in lib/checkout/deliveryCost.ts and the
// docx brief's Phase 1 launch market (Abuja/FCT), plus the two other major
// hubs construction materials commonly move through.
const FULFILLMENT_CENTERS = [
  {
    name: 'Abuja Central Fulfillment Centre',
    region: 'ABUJA',
    address: 'Plot 12, Idu Industrial Area, Abuja, FCT',
  },
  {
    name: 'Lagos Mainland Fulfillment Centre',
    region: 'LAGOS',
    address: '14 Oshodi-Apapa Expressway, Lagos',
  },
  {
    name: 'Kano Depot Fulfillment Centre',
    region: 'KANO',
    address: 'Bompai Road Industrial Layout, Kano',
  },
];

// A spread of seller maturity levels so the award engine's trust-score
// weight and geography eligibility filter both have something real to
// operate on: one national high-trust seller, two regional mid-trust
// sellers, one newly onboarded low-trust seller.
const SELLERS = [
  {
    name: 'Dangote Building Materials',
    email: 'sales@dangotematerials.example',
    businessName: 'Dangote Building Materials Ltd',
    location: 'Lagos',
    regionsServed: ['ABUJA', 'LAGOS', 'KANO'],
    trustScore: 92,
  },
  {
    name: 'Northern Aggregates Co',
    email: 'orders@northernaggregates.example',
    businessName: 'Northern Aggregates Company',
    location: 'Kano',
    regionsServed: ['KANO', 'ABUJA'],
    trustScore: 74,
  },
  {
    name: 'Lekki Rebar Supplies',
    email: 'contact@lekkirebar.example',
    businessName: 'Lekki Rebar Supplies Ltd',
    location: 'Lagos',
    regionsServed: ['LAGOS'],
    trustScore: 68,
  },
  {
    name: 'FCT Fittings & Roofing',
    email: 'hello@fctfittings.example',
    businessName: 'FCT Fittings & Roofing Ventures',
    location: 'Abuja',
    regionsServed: ['ABUJA'],
    trustScore: 40,
  },
];

// Catalog spanning the categories named in the project brief (cement,
// blocks, rebar, roofing, fittings). catalogPrice is the buyer-facing fixed
// price (₦). sourcingScope splits between NATIONAL materials that ship
// anywhere (cement, steel, PVC) and REGIONAL materials that are heavy/bulky
// or locally produced (blocks, roofing sheet) — mirroring the brief's "REGIONAL
// and NATIONAL pooling both exist side by side".
const MATERIALS = [
  {
    name: 'Dangote Cement 42.5R',
    category: 'Cement',
    unit: '50kg bag',
    spec: 'Grade 42.5R, CEM II',
    grade: '42.5R',
    standard: 'CEM II',
    dimensions: null,
    weight: '50kg',
    catalogPrice: 7500,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'BUA Cement 42.5R',
    category: 'Cement',
    unit: '50kg bag',
    spec: 'Grade 42.5R, CEM II',
    grade: '42.5R',
    standard: 'CEM II',
    dimensions: null,
    weight: '50kg',
    catalogPrice: 7200,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'Sandcrete Block, 9 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '225mm, solid',
    grade: 'Solid',
    standard: null,
    dimensions: '225mm',
    weight: null,
    catalogPrice: 550,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Sandcrete Block, 6 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '150mm, solid',
    grade: 'Solid',
    standard: null,
    dimensions: '150mm',
    weight: null,
    catalogPrice: 450,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Reinforcement Rod, 12mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y12 high-yield deformed bar',
    grade: 'Y12',
    standard: null,
    dimensions: '12m length',
    weight: null,
    catalogPrice: 9500,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Reinforcement Rod, 16mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y16 high-yield deformed bar',
    grade: 'Y16',
    standard: null,
    dimensions: '12m length',
    weight: null,
    catalogPrice: 16800,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Aluminium Roofing Sheet, 0.55mm',
    category: 'Roofing',
    unit: 'sheet',
    spec: '0.55mm gauge, long-span',
    grade: 'Long-span',
    standard: null,
    dimensions: '0.55mm gauge',
    weight: null,
    catalogPrice: 4200,
    sourcingScope: SourcingScope.REGIONAL,
  },
  {
    name: 'Stone-Coated Roofing Tile',
    category: 'Roofing',
    unit: 'sheet',
    spec: '1340mm x 420mm, classic profile',
    grade: 'Classic profile',
    standard: null,
    dimensions: '1340mm x 420mm',
    weight: null,
    catalogPrice: 8500,
    sourcingScope: SourcingScope.NATIONAL,
  },
  {
    name: 'PVC Conduit Pipe, 20mm',
    category: 'Fittings',
    unit: '3m length',
    spec: '20mm diameter, heavy gauge',
    grade: 'Heavy gauge',
    standard: null,
    dimensions: '20mm diameter x 3m length',
    weight: null,
    catalogPrice: 650,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
  {
    name: 'PVC Elbow Fitting, 20mm',
    category: 'Fittings',
    unit: 'piece',
    spec: '20mm diameter, 90-degree',
    grade: '90-degree',
    standard: null,
    dimensions: '20mm diameter',
    weight: null,
    catalogPrice: 150,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
  // Added 2026-09-15 to give the catalog more depth for end-to-end testing —
  // same real brands/specs/pricing conventions as above, reusing the existing
  // category photos rather than sourcing new ones. Roofing still has no real
  // photo (see the imageUrl-less entries above), so these stay consistent
  // with that and render the category-icon placeholder like the others.
  {
    name: 'Elephant Cement 42.5R',
    category: 'Cement',
    unit: '50kg bag',
    spec: 'Grade 42.5R, CEM II',
    grade: '42.5R',
    standard: 'CEM II',
    dimensions: null,
    weight: '50kg',
    catalogPrice: 7300,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'Ashaka Cement 32.5R',
    category: 'Cement',
    unit: '50kg bag',
    spec: 'Grade 32.5R, general purpose',
    grade: '32.5R',
    standard: null,
    dimensions: null,
    weight: '50kg',
    catalogPrice: 6900,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'Sandcrete Block, 5 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '125mm, solid',
    grade: 'Solid',
    standard: null,
    dimensions: '125mm',
    weight: null,
    catalogPrice: 380,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Hollow Block, 9 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '225mm, hollow',
    grade: 'Hollow',
    standard: null,
    dimensions: '225mm',
    weight: null,
    catalogPrice: 500,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Reinforcement Rod, 10mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y10 high-yield deformed bar',
    grade: 'Y10',
    standard: null,
    dimensions: '12m length',
    weight: null,
    catalogPrice: 6800,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Reinforcement Rod, 20mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y20 high-yield deformed bar',
    grade: 'Y20',
    standard: null,
    dimensions: '12m length',
    weight: null,
    catalogPrice: 24500,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Zinc Aluminium Roofing Sheet, 0.45mm',
    category: 'Roofing',
    unit: 'sheet',
    spec: '0.45mm gauge, long-span',
    grade: 'Long-span',
    standard: null,
    dimensions: '0.45mm gauge',
    weight: null,
    catalogPrice: 3600,
    sourcingScope: SourcingScope.REGIONAL,
  },
  {
    name: 'Step Tile Roofing Sheet',
    category: 'Roofing',
    unit: 'sheet',
    spec: '1250mm x 950mm, step-tile profile',
    grade: 'Step-tile profile',
    standard: null,
    dimensions: '1250mm x 950mm',
    weight: null,
    catalogPrice: 7800,
    sourcingScope: SourcingScope.NATIONAL,
  },
  {
    name: 'PVC Tee Fitting, 20mm',
    category: 'Fittings',
    unit: 'piece',
    spec: '20mm diameter, equal tee',
    grade: 'Equal tee',
    standard: null,
    dimensions: '20mm diameter',
    weight: null,
    catalogPrice: 200,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
  {
    name: 'PVC Conduit Pipe, 25mm',
    category: 'Fittings',
    unit: '3m length',
    spec: '25mm diameter, heavy gauge',
    grade: 'Heavy gauge',
    standard: null,
    dimensions: '25mm diameter x 3m length',
    weight: null,
    catalogPrice: 780,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
];

async function seedMaterials() {
  let created = 0;
  let imagesPatched = 0;
  let priceSnapshotsBackfilled = 0;
  let specsPatched = 0;
  for (const material of MATERIALS) {
    const existing = await prisma.material.findFirst({
      where: { name: material.name },
    });

    if (!existing) {
      const row = await prisma.material.create({
        data: { ...material, images: material.imageUrl ? [material.imageUrl] : [] },
      });
      await prisma.priceSnapshot.create({
        data: { materialId: row.id, price: row.catalogPrice, recordedAt: row.createdAt },
      });
      created++;
      continue;
    }

    // Backfill imageUrl on rows seeded before real product photos existed —
    // never overwrites an image already set some other way.
    if (!existing.imageUrl && material.imageUrl) {
      await prisma.material.update({
        where: { id: existing.id },
        data: { imageUrl: material.imageUrl },
      });
      existing.imageUrl = material.imageUrl;
      imagesPatched++;
    }

    // Room for a real gallery (2026-09-16) — `images` only ever gets the
    // one real photo this row already has, duplicated as a single entry.
    // Never invents additional angles/photos that don't exist.
    if (existing.images.length === 0 && existing.imageUrl) {
      await prisma.material.update({
        where: { id: existing.id },
        data: { images: [existing.imageUrl] },
      });
    }

    // Backfill the structured spec grid (grade/standard/dimensions/weight)
    // on rows seeded before those columns existed (2026-09-15) — only fills
    // fields that are currently null, never overwrites a real edit.
    const specUpdate: Record<string, string | null> = {};
    for (const key of ['grade', 'standard', 'dimensions', 'weight'] as const) {
      if (existing[key] === null && material[key] !== undefined) {
        specUpdate[key] = material[key];
      }
    }
    if (Object.keys(specUpdate).length > 0) {
      await prisma.material.update({ where: { id: existing.id }, data: specUpdate });
      specsPatched++;
    }

    // Backfill a first PriceSnapshot on rows seeded before price history
    // existed — accurate, not fabricated, since catalogPrice has never
    // changed without a snapshot being recorded alongside it.
    const hasSnapshot = await prisma.priceSnapshot.findFirst({ where: { materialId: existing.id } });
    if (!hasSnapshot) {
      await prisma.priceSnapshot.create({
        data: { materialId: existing.id, price: existing.catalogPrice, recordedAt: existing.createdAt },
      });
      priceSnapshotsBackfilled++;
    }
  }
  return { created, imagesPatched, priceSnapshotsBackfilled, specsPatched };
}

async function seedFulfillmentCenters() {
  let created = 0;
  for (const center of FULFILLMENT_CENTERS) {
    const existing = await prisma.fulfillmentCenter.findFirst({
      where: { name: center.name },
    });
    if (existing) continue;

    await prisma.fulfillmentCenter.create({ data: center });
    created++;
  }
  return created;
}

async function seedSellers() {
  let created = 0;
  for (const seller of SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: seller.email },
      update: {},
      create: {
        role: Role.SELLER,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        location: seller.location,
      },
    });

    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (existingProfile) continue;

    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        regionsServed: seller.regionsServed,
        trustScore: seller.trustScore,
      },
    });
    created++;
  }
  return created;
}

async function seedDemoBuyer() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_BUYER_EMAIL } });
  if (existing) return 0;

  await prisma.user.create({
    data: {
      role: Role.BUYER,
      name: 'Demo Buyer',
      email: DEMO_BUYER_EMAIL,
      businessName: 'Demo Construction Ltd',
      location: 'Abuja',
    },
  });
  return 1;
}

async function seedDemoAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_ADMIN_EMAIL } });
  if (existing) return 0;

  await prisma.user.create({
    data: {
      role: Role.ADMIN,
      name: 'Ops Admin',
      email: DEMO_ADMIN_EMAIL,
    },
  });
  return 1;
}

async function main() {
  const { created: materialsCreated, imagesPatched, priceSnapshotsBackfilled, specsPatched } = await seedMaterials();
  const centersCreated = await seedFulfillmentCenters();
  const sellersCreated = await seedSellers();
  const buyerCreated = await seedDemoBuyer();
  const adminCreated = await seedDemoAdmin();
  console.log(
    `Seeded ${materialsCreated} material(s) (${imagesPatched} image(s) backfilled, ${priceSnapshotsBackfilled} price snapshot(s) backfilled, ${specsPatched} spec grid(s) backfilled), ${centersCreated} fulfillment center(s), ${sellersCreated} seller profile(s), ${buyerCreated} demo buyer(s), ${adminCreated} demo admin(s).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
