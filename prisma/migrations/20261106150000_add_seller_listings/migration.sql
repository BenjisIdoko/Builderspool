-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingQcResult" AS ENUM ('PASSED', 'NEEDS_REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "perishable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SellerListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 1,
    "shelfLifeDays" INTEGER,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "qcResult" "ListingQcResult",
    "qcReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qcMedianPrice" DECIMAL(12,2),
    "qcCheckedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerListing_materialId_status_idx" ON "SellerListing"("materialId", "status");

-- CreateIndex
CREATE INDEX "SellerListing_status_idx" ON "SellerListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SellerListing_sellerId_materialId_key" ON "SellerListing"("sellerId", "materialId");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_idx" ON "ListingPhoto"("listingId");

-- AddForeignKey
ALTER TABLE "SellerListing" ADD CONSTRAINT "SellerListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerListing" ADD CONSTRAINT "SellerListing_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SellerListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

