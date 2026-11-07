-- Manual rollback for 20261107120000_add_pool_sheets. NOT run by Prisma.
-- Safe only while no pooled line points at a sheet; otherwise those links are lost.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_sheetLineId_fkey";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "sheetLineId";
DROP TABLE IF EXISTS "SheetBidLine";
DROP TABLE IF EXISTS "SheetBid";
DROP TABLE IF EXISTS "PoolSheetLine";
DROP TABLE IF EXISTS "PoolSheet";
DROP TABLE IF EXISTS "SellerCategory";
DROP TYPE IF EXISTS "SheetBidStatus";
DROP TYPE IF EXISTS "SheetStatus";
