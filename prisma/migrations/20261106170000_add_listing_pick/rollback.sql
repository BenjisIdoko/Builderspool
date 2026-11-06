-- Manual rollback for 20261106170000_add_listing_pick. NOT run by Prisma.
-- Drops the recorded seller picks on cart and order lines; prices already locked stay.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_listingId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_listingId_fkey";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "listingId";
ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "listingId";
