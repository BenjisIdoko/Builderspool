-- Manual rollback for 20261106150000_add_seller_listings. NOT run by Prisma.
-- Safe only while the new tables are empty or you accept losing their rows.
DROP TABLE IF EXISTS "ListingPhoto";
DROP TABLE IF EXISTS "SellerListing";
ALTER TABLE "Material" DROP COLUMN IF EXISTS "perishable";
DROP TYPE IF EXISTS "ListingQcResult";
DROP TYPE IF EXISTS "ListingStatus";
