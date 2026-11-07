-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "localityId" TEXT,
ADD COLUMN     "zoneId" TEXT;

-- CreateIndex
CREATE INDEX "Order_zoneId_idx" ON "Order"("zoneId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
