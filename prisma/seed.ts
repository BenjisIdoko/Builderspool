import { PrismaClient, Role, SourcingScope, ProjectScale, SourcingModel, KycStatus } from '@prisma/client';
import { DEMO_BUYER_EMAIL } from '../lib/demoBuyer';
import { DEMO_ADMIN_EMAIL } from '../lib/demoAdmin';
import { hashPassword } from '../lib/auth/password';
import catalogueReferenceData from './catalogue-reference-data.json';

// One real, documented demo password for every seeded account (buyer,
// sellers, admin) — not a fabricated-looking per-account secret, just the
// single known credential this whole demo has always implicitly had,
// now backed by a real bcrypt hash instead of no password check at all.
export const DEMO_PASSWORD = 'builderspool-demo';

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
    kycStatus: KycStatus.APPROVED,
  },
  {
    name: 'Northern Aggregates Co',
    email: 'orders@northernaggregates.example',
    businessName: 'Northern Aggregates Company',
    location: 'Kano',
    regionsServed: ['KANO', 'ABUJA'],
    trustScore: 74,
    kycStatus: KycStatus.APPROVED,
  },
  {
    name: 'Lekki Rebar Supplies',
    email: 'contact@lekkirebar.example',
    businessName: 'Lekki Rebar Supplies Ltd',
    location: 'Lagos',
    regionsServed: ['LAGOS'],
    trustScore: 68,
    kycStatus: KycStatus.PENDING,
  },
  {
    name: 'FCT Fittings & Roofing',
    email: 'hello@fctfittings.example',
    businessName: 'FCT Fittings & Roofing Ventures',
    location: 'Abuja',
    regionsServed: ['ABUJA'],
    trustScore: 40,
    kycStatus: KycStatus.NOT_SUBMITTED,
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

// Real haulage fleet (2026-09-16) — enough to demonstrate real dispatch
// assignment against real delivery order items, not a fabricated telemetry
// feed. currentLocation is manually-entered free text, matching how an ops
// team without GPS integration would actually track this.
const VEHICLES = [
  { plateNumber: 'ABJ-442-KJA', type: '10-ton flatbed truck', capacityTons: 10, driverName: 'Suleiman Bello', driverPhone: '08023456781' },
  { plateNumber: 'LAG-118-XQ', type: 'Dropside truck', capacityTons: 6, driverName: 'Chidi Okafor', driverPhone: '08034567892' },
  { plateNumber: 'KAN-905-BT', type: 'Cargo tricycle', capacityTons: 1.5, driverName: 'Ibrahim Musa', driverPhone: '08045678903' },
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
    if (existingProfile) {
      // Backfill KYC demo fields on profiles seeded before KYC existed
      // (2026-09-16) — only when still at the schema default, never
      // overwrites a real submission/review.
      if (existingProfile.kycStatus === KycStatus.NOT_SUBMITTED && seller.kycStatus !== KycStatus.NOT_SUBMITTED) {
        await prisma.sellerProfile.update({
          where: { id: existingProfile.id },
          data: {
            kycStatus: seller.kycStatus,
            kycSubmittedAt: new Date(),
            kycReviewedAt: seller.kycStatus === KycStatus.PENDING ? null : new Date(),
            businessRegNumber: `RC${1200000 + created}`,
            cacNumber: `CAC-${seller.location.slice(0, 3).toUpperCase()}-${1000 + created}`,
            idType: 'International passport',
            idNumber: `A${10000000 + created}`,
          },
        });
      }
      continue;
    }

    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        regionsServed: seller.regionsServed,
        trustScore: seller.trustScore,
        kycStatus: seller.kycStatus,
        kycSubmittedAt: seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : new Date(),
        kycReviewedAt: seller.kycStatus === KycStatus.PENDING || seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : new Date(),
        businessRegNumber: seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : `RC${1200000 + created}`,
        cacNumber: seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : `CAC-${seller.location.slice(0, 3).toUpperCase()}-${1000 + created}`,
        idType: seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : 'International passport',
        idNumber: seller.kycStatus === KycStatus.NOT_SUBMITTED ? null : `A${10000000 + created}`,
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

// Catalogue reference library — see the schema comment on Category/Product
// in schema.prisma. Sourced from an external research file (2026-09-16),
// entirely separate from the live Material catalog above; upserts on
// Category.slug / Product.sku so it's safe to re-run after editing the data.
type SeedProduct = {
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  specification: string | null;
  standard: string | null;
  commonBrands: string | null;
  brand: string | null;
  unitOfSale: string;
  packSize: string | null;
  projectScale: keyof typeof ProjectScale;
  sourcingModel: keyof typeof SourcingModel;
  priceNote: string | null;
  imageSearchTerm: string | null;
  notes: string | null;
};

type SeedCategory = {
  name: string;
  slug: string;
  sortOrder: number;
  products: SeedProduct[];
};

async function seedCatalogueReference() {
  const categories = (catalogueReferenceData as { categories: SeedCategory[] }).categories;
  let categoriesUpserted = 0;
  let productsUpserted = 0;

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });
    categoriesUpserted++;

    for (const p of cat.products) {
      const data = {
        name: p.name,
        slug: p.slug,
        description: p.description,
        specification: p.specification,
        standard: p.standard,
        commonBrands: p.commonBrands,
        brand: p.brand,
        unitOfSale: p.unitOfSale,
        packSize: p.packSize,
        projectScale: ProjectScale[p.projectScale],
        sourcingModel: SourcingModel[p.sourcingModel],
        priceNote: p.priceNote,
        imageSearchTerm: p.imageSearchTerm,
        notes: p.notes,
        categoryId: category.id,
      };
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: data,
        create: { sku: p.sku, ...data },
      });
      productsUpserted++;
    }
  }

  return { categoriesUpserted, productsUpserted };
}

// Extracts a real single price from a researched "₦X–₦Y" (or multi-range,
// e.g. budget/premium) priceNote by averaging the lowest and highest ₦
// figures actually stated — a real derived number, not an invented one.
// Returns null when the note has fewer than two ₦ figures to average (the
// "Market rate — set via seller bidding; verify live" case, which is most
// of the library).
function parsePriceNote(priceNote: string | null): number | null {
  if (!priceNote) return null;
  const matches = priceNote.match(/₦[\d,]+/g);
  if (!matches || matches.length < 2) return null;
  const numbers = matches.map((m) => Number(m.replace(/[₦,]/g, '')));
  return Math.round((Math.min(...numbers) + Math.max(...numbers)) / 2);
}

// Populates the live buyer catalog from the catalogue reference library
// (2026-09-16, per explicit user direction: import all 134 products, use a
// placeholder price where the research has none, admin corrects later via
// the materials editor). Distinct from seedMaterials()'s hand-curated
// MATERIALS array — this bulk-imports from catalogueReferenceData instead,
// and is idempotent the same way (skip if a Material with that name
// already exists), so re-running `prisma db seed` never creates
// duplicates. Left alongside the original 20 curated materials rather than
// replacing them — several reference products (e.g. BUA/Dangote cement)
// describe the same real goods under slightly different names/categories,
// which is a known, disclosed overlap for admin to consolidate over time
// now that the materials editor exists, not something this script tries
// to silently resolve.
const PLACEHOLDER_PRICE = 1;

async function seedMaterialsFromReference() {
  const categories = (catalogueReferenceData as { categories: SeedCategory[] }).categories;
  let created = 0;
  let skippedExisting = 0;
  let needingPriceReview = 0;

  for (const cat of categories) {
    for (const p of cat.products) {
      const existing = await prisma.material.findFirst({ where: { name: p.name } });
      if (existing) {
        skippedExisting++;
        continue;
      }

      const derivedPrice = parsePriceNote(p.priceNote);
      const catalogPrice = derivedPrice ?? PLACEHOLDER_PRICE;
      const needsPriceReview = derivedPrice === null;
      if (needsPriceReview) needingPriceReview++;

      const sourcingScope = p.sourcingModel === 'REGIONAL' ? SourcingScope.REGIONAL : SourcingScope.NATIONAL;

      const row = await prisma.material.create({
        data: {
          name: p.name,
          category: cat.name,
          unit: p.packSize ? `${p.unitOfSale} (${p.packSize})` : p.unitOfSale,
          spec: p.specification,
          standard: p.standard,
          catalogPrice,
          needsPriceReview,
          sourcingScope,
        },
      });
      await prisma.priceSnapshot.create({
        data: { materialId: row.id, price: row.catalogPrice, recordedAt: row.createdAt },
      });
      created++;
    }
  }

  return { created, skippedExisting, needingPriceReview };
}

// Backfills a real bcrypt hash of DEMO_PASSWORD onto any seeded account
// created before real auth existed — never overwrites a hash a real
// sign-up already set. Idempotent: does nothing once every row has one.
async function seedPasswords() {
  const users = await prisma.user.findMany({ where: { passwordHash: null }, select: { id: true } });
  if (users.length === 0) return 0;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await prisma.user.updateMany({ where: { id: { in: users.map((u) => u.id) } }, data: { passwordHash } });
  return users.length;
}

// Seeds the vehicle/driver fleet, then dispatches real vehicles against
// real PAID delivery order items that already have an allocation (a seller
// assigned to fulfill them) — a pickup order item (deliveryCost === 0)
// never gets a dispatch, since nothing needs hauling. Idempotent: skips an
// order item that already has one.
async function seedHaulage() {
  let vehiclesCreated = 0;
  const vehicleIds: string[] = [];
  for (const v of VEHICLES) {
    const existing = await prisma.vehicle.findUnique({ where: { plateNumber: v.plateNumber } });
    if (existing) {
      vehicleIds.push(existing.id);
      continue;
    }
    const vehicle = await prisma.vehicle.create({
      data: { plateNumber: v.plateNumber, type: v.type, capacityTons: v.capacityTons },
    });
    const existingDriver = await prisma.driver.findFirst({ where: { phone: v.driverPhone } });
    if (!existingDriver) {
      await prisma.driver.create({ data: { name: v.driverName, phone: v.driverPhone, vehicleId: vehicle.id } });
    }
    vehicleIds.push(vehicle.id);
    vehiclesCreated++;
  }

  const deliveryItems = await prisma.orderItem.findMany({
    where: { deliveryCost: { gt: 0 }, order: { status: 'PAID' }, dispatch: null },
    include: { allocations: { select: { status: true, grnNumber: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const dispatchable = deliveryItems.filter((item) => item.allocations.some((a) => a.status !== 'CANCELLED'));

  // A real, deterministic spread across the three real dispatch states an
  // ops team would actually see on any given day — not every seeded order
  // dumped into the same status.
  const STATUS_CYCLE = ['DELIVERED', 'IN_TRANSIT', 'ASSIGNED'] as const;

  let dispatchesCreated = 0;
  for (let i = 0; i < dispatchable.length; i++) {
    const item = dispatchable[i];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const vehicleId = vehicleIds[i % vehicleIds.length];
    const hasGrn = item.allocations.some((a) => a.grnNumber);

    await prisma.dispatch.create({
      data: {
        orderItemId: item.id,
        vehicleId,
        status,
        dispatchedAt: status !== 'ASSIGNED' ? new Date() : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
        currentLocation:
          status === 'IN_TRANSIT'
            ? 'En route — last checkpoint logged by ops'
            : status === 'ASSIGNED' && !hasGrn
              ? 'Awaiting fulfillment center GRN before dispatch'
              : null,
      },
    });
    dispatchesCreated++;
  }

  return { vehiclesCreated, dispatchesCreated };
}

async function main() {
  const { created: materialsCreated, imagesPatched, priceSnapshotsBackfilled, specsPatched } = await seedMaterials();
  const centersCreated = await seedFulfillmentCenters();
  const sellersCreated = await seedSellers();
  const buyerCreated = await seedDemoBuyer();
  const adminCreated = await seedDemoAdmin();
  const passwordsBackfilled = await seedPasswords();
  const { categoriesUpserted, productsUpserted } = await seedCatalogueReference();
  const { created: refMaterialsCreated, skippedExisting, needingPriceReview } = await seedMaterialsFromReference();
  console.log(
    `Seeded ${materialsCreated} material(s) (${imagesPatched} image(s) backfilled, ${priceSnapshotsBackfilled} price snapshot(s) backfilled, ${specsPatched} spec grid(s) backfilled), ${centersCreated} fulfillment center(s), ${sellersCreated} seller profile(s), ${buyerCreated} demo buyer(s), ${adminCreated} demo admin(s).`
  );
  console.log(
    `Catalogue reference library: ${categoriesUpserted} categories, ${productsUpserted} products upserted.`
  );
  console.log(
    `Materials imported from reference library: ${refMaterialsCreated} created (${needingPriceReview} need a real price — currently ₦${PLACEHOLDER_PRICE} placeholder), ${skippedExisting} skipped (already exist).`
  );
  console.log(`Passwords backfilled for ${passwordsBackfilled} account(s) — demo password: "${DEMO_PASSWORD}".`);
  const { vehiclesCreated, dispatchesCreated } = await seedHaulage();
  console.log(`Haulage: ${vehiclesCreated} vehicle(s) seeded, ${dispatchesCreated} dispatch(es) created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
