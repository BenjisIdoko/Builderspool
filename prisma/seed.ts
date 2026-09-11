import { PrismaClient, Role } from '@prisma/client';

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

async function main() {
  const centersCreated = await seedFulfillmentCenters();
  const sellersCreated = await seedSellers();
  console.log(`Seeded ${centersCreated} fulfillment center(s), ${sellersCreated} seller profile(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
