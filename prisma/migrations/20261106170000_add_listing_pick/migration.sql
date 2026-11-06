-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "listingId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "listingId" TEXT;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

