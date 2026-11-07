-- Manual rollback for 20261107100000_add_order_locality. NOT run by Prisma.
-- Drops the recorded locality and zone on orders; nothing else depends on them yet.
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_zoneId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_localityId_fkey";
DROP INDEX IF EXISTS "Order_zoneId_idx";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "zoneId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "localityId";
