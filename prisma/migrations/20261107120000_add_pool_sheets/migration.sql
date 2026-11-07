-- CreateEnum
CREATE TYPE "SheetStatus" AS ENUM ('OPEN', 'BIDDING', 'AWARDING', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SheetBidStatus" AS ENUM ('SUBMITTED', 'ELIGIBLE', 'INELIGIBLE');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sheetLineId" TEXT;

-- CreateTable
CREATE TABLE "SellerCategory" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "CoverageStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolSheet" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "SheetStatus" NOT NULL DEFAULT 'OPEN',
    "poolClosesAt" TIMESTAMP(3) NOT NULL,
    "bidsCloseAt" TIMESTAMP(3) NOT NULL,
    "rank1EndsAt" TIMESTAMP(3) NOT NULL,
    "rank2EndsAt" TIMESTAMP(3) NOT NULL,
    "rank3EndsAt" TIMESTAMP(3) NOT NULL,
    "frozenAt" TIMESTAMP(3),
    "awardedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolSheetLine" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "referencePrice" DECIMAL(12,2),

    CONSTRAINT "PoolSheetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetBid" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "SheetBidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "ineligibleReason" TEXT,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetBidLine" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SheetBidLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerCategory_category_status_idx" ON "SellerCategory"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SellerCategory_sellerId_category_key" ON "SellerCategory"("sellerId", "category");

-- CreateIndex
CREATE INDEX "PoolSheet_status_poolClosesAt_idx" ON "PoolSheet"("status", "poolClosesAt");

-- CreateIndex
CREATE UNIQUE INDEX "PoolSheet_category_zoneId_date_key" ON "PoolSheet"("category", "zoneId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PoolSheetLine_sheetId_materialId_key" ON "PoolSheetLine"("sheetId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetBid_sheetId_sellerId_key" ON "SheetBid"("sheetId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetBidLine_bidId_lineId_key" ON "SheetBidLine"("bidId", "lineId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sheetLineId_fkey" FOREIGN KEY ("sheetLineId") REFERENCES "PoolSheetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerCategory" ADD CONSTRAINT "SellerCategory_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSheet" ADD CONSTRAINT "PoolSheet_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSheetLine" ADD CONSTRAINT "PoolSheetLine_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "PoolSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSheetLine" ADD CONSTRAINT "PoolSheetLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetBid" ADD CONSTRAINT "SheetBid_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "PoolSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetBid" ADD CONSTRAINT "SheetBid_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetBidLine" ADD CONSTRAINT "SheetBidLine_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "SheetBid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetBidLine" ADD CONSTRAINT "SheetBidLine_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "PoolSheetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

