-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pickupCenterId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pickupCenterId_fkey" FOREIGN KEY ("pickupCenterId") REFERENCES "FulfillmentCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
