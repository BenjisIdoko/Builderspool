-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING_GRN', 'PROCESSED', 'PAID', 'ON_HOLD');

-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "grnNumber" TEXT,
ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "payoutReference" TEXT,
ADD COLUMN     "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING_GRN';

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_grnNumber_key" ON "Allocation"("grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_payoutReference_key" ON "Allocation"("payoutReference");

