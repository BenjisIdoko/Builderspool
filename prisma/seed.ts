import { PrismaClient, Role, SourcingScope } from '@prisma/client';
import { DEMO_BUYER_EMAIL } from '../lib/demoBuyer';

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
    catalogPrice: 7500,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'BUA Cement 42.5R',
    category: 'Cement',
    unit: '50kg bag',
    spec: 'Grade 42.5R, CEM II',
    catalogPrice: 7200,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/cement.jpg',
  },
  {
    name: 'Sandcrete Block, 9 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '225mm, solid',
    catalogPrice: 550,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Sandcrete Block, 6 inch',
    category: 'Blocks',
    unit: 'block',
    spec: '150mm, solid',
    catalogPrice: 450,
    sourcingScope: SourcingScope.REGIONAL,
    imageUrl: '/materials/blocks.jpg',
  },
  {
    name: 'Reinforcement Rod, 12mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y12 high-yield deformed bar',
    catalogPrice: 9500,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Reinforcement Rod, 16mm',
    category: 'Rebar',
    unit: '12m length',
    spec: 'Y16 high-yield deformed bar',
    catalogPrice: 16800,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/rebar.jpg',
  },
  {
    name: 'Aluminium Roofing Sheet, 0.55mm',
    category: 'Roofing',
    unit: 'sheet',
    spec: '0.55mm gauge, long-span',
    catalogPrice: 4200,
    sourcingScope: SourcingScope.REGIONAL,
  },
  {
    name: 'Stone-Coated Roofing Tile',
    category: 'Roofing',
    unit: 'sheet',
    spec: '1340mm x 420mm, classic profile',
    catalogPrice: 8500,
    sourcingScope: SourcingScope.NATIONAL,
  },
  {
    name: 'PVC Conduit Pipe, 20mm',
    category: 'Fittings',
    unit: '3m length',
    spec: '20mm diameter, heavy gauge',
    catalogPrice: 650,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
  {
    name: 'PVC Elbow Fitting, 20mm',
    category: 'Fittings',
    unit: 'piece',
    spec: '20mm diameter, 90-degree',
    catalogPrice: 150,
    sourcingScope: SourcingScope.NATIONAL,
    imageUrl: '/materials/fittings.jpg',
  },
];

async function seedMaterials() {
  let created = 0;
  let imagesPatched = 0;
  for (const material of MATERIALS) {
    const existing = await prisma.material.findFirst({
      where: { name: material.name },
    });

    if (!existing) {
      await prisma.material.create({ data: material });
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
      imagesPatched++;
    }
  }
  return { created, imagesPatched };
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

async function main() {
  const { created: materialsCreated, imagesPatched } = await seedMaterials();
  const centersCreated = await seedFulfillmentCenters();
  const sellersCreated = await seedSellers();
  const buyerCreated = await seedDemoBuyer();
  console.log(
    `Seeded ${materialsCreated} material(s) (${imagesPatched} image(s) backfilled), ${centersCreated} fulfillment center(s), ${sellersCreated} seller profile(s), ${buyerCreated} demo buyer(s).`
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
