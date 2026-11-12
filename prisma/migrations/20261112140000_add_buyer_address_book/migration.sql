-- CreateTable
CREATE TABLE "BuyerAddress" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "localityId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerPickupStation" (
    "buyerId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerPickupStation_pkey" PRIMARY KEY ("buyerId","centerId")
);

-- CreateIndex
CREATE INDEX "BuyerAddress_buyerId_idx" ON "BuyerAddress"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerPickupStation_centerId_idx" ON "BuyerPickupStation"("centerId");

-- AddForeignKey
ALTER TABLE "BuyerAddress" ADD CONSTRAINT "BuyerAddress_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerAddress" ADD CONSTRAINT "BuyerAddress_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPickupStation" ADD CONSTRAINT "BuyerPickupStation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPickupStation" ADD CONSTRAINT "BuyerPickupStation_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "FulfillmentCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Buyers who already chose a pickup station keep it, now as a saved station.
INSERT INTO "BuyerPickupStation" ("buyerId", "centerId")
SELECT "id", "pickupCenterId" FROM "User" WHERE "pickupCenterId" IS NOT NULL
ON CONFLICT DO NOTHING;
