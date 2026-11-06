-- CreateEnum
CREATE TYPE "PurchaseMode" AS ENUM ('POOL', 'DIRECT');

-- CreateEnum
CREATE TYPE "DirectStatus" AS ENUM ('AWAITING_ACCEPT', 'ACCEPTED', 'FULFILLED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "mode" "PurchaseMode" NOT NULL DEFAULT 'POOL';

-- CreateTable
CREATE TABLE "DirectFulfilment" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "listingId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "status" "DirectStatus" NOT NULL DEFAULT 'AWAITING_ACCEPT',
    "acceptDeadlineAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "receivedAt" TIMESTAMP(3),
    "grnNumber" TEXT,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING_GRN',
    "payoutReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "holdReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectFulfilment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectFulfilment_orderItemId_key" ON "DirectFulfilment"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectFulfilment_grnNumber_key" ON "DirectFulfilment"("grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DirectFulfilment_payoutReference_key" ON "DirectFulfilment"("payoutReference");

-- CreateIndex
CREATE INDEX "DirectFulfilment_sellerId_status_idx" ON "DirectFulfilment"("sellerId", "status");

-- CreateIndex
CREATE INDEX "DirectFulfilment_status_acceptDeadlineAt_idx" ON "DirectFulfilment"("status", "acceptDeadlineAt");

-- AddForeignKey
ALTER TABLE "DirectFulfilment" ADD CONSTRAINT "DirectFulfilment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectFulfilment" ADD CONSTRAINT "DirectFulfilment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

