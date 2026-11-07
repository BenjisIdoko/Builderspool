-- CreateEnum
CREATE TYPE "SheetFulfilmentStatus" AS ENUM ('PENDING', 'FULFILLED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SHEET_OPENED';
ALTER TYPE "NotificationType" ADD VALUE 'SHEET_OFFERED';

-- AlterTable
ALTER TABLE "PoolSheet" ADD COLUMN     "settledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SavingsWalletEntry" ADD COLUMN     "sheetFulfilmentId" TEXT,
ALTER COLUMN "allocationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SheetFulfilment" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "status" "SheetFulfilmentStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "grnNumber" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING_GRN',
    "payoutReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "holdReason" TEXT,
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheetFulfilment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SheetFulfilment_orderItemId_key" ON "SheetFulfilment"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetFulfilment_grnNumber_key" ON "SheetFulfilment"("grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SheetFulfilment_payoutReference_key" ON "SheetFulfilment"("payoutReference");

-- CreateIndex
CREATE INDEX "SheetFulfilment_sellerId_status_idx" ON "SheetFulfilment"("sellerId", "status");

-- CreateIndex
CREATE INDEX "SheetFulfilment_sheetId_idx" ON "SheetFulfilment"("sheetId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsWalletEntry_sheetFulfilmentId_key" ON "SavingsWalletEntry"("sheetFulfilmentId");

-- AddForeignKey
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_sheetFulfilmentId_fkey" FOREIGN KEY ("sheetFulfilmentId") REFERENCES "SheetFulfilment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetFulfilment" ADD CONSTRAINT "SheetFulfilment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetFulfilment" ADD CONSTRAINT "SheetFulfilment_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "PoolSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetFulfilment" ADD CONSTRAINT "SheetFulfilment_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "SheetBid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetFulfilment" ADD CONSTRAINT "SheetFulfilment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written safety check (Prisma does not model CHECK constraints): a savings entry
-- belongs to exactly one source, an older per-material allocation or a category-sheet
-- fulfilment. Every existing row has allocationId set and sheetFulfilmentId null, so it holds.
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_one_source_check"
  CHECK (("allocationId" IS NULL) <> ("sheetFulfilmentId" IS NULL));
