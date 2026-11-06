-- Manual rollback for 20261106120000_add_service_areas. NOT run by Prisma.
-- Safe only while the new tables are empty or you accept losing their rows.
ALTER TABLE "FulfillmentCenter" DROP CONSTRAINT IF EXISTS "FulfillmentCenter_localityId_fkey";
DROP TABLE IF EXISTS "DeliveryRequest";
DROP TABLE IF EXISTS "SellerZoneCoverage";
DROP TABLE IF EXISTS "Locality";
DROP TABLE IF EXISTS "DeliveryZone";
DROP TABLE IF EXISTS "Lga";
DROP TABLE IF EXISTS "State";
ALTER TABLE "FulfillmentCenter" DROP COLUMN IF EXISTS "localityId";
ALTER TABLE "SellerProfile" DROP COLUMN IF EXISTS "nationalSupply";
DROP TYPE IF EXISTS "CoverageStatus";
DROP TYPE IF EXISTS "LocalityKind";
