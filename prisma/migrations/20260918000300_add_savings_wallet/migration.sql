-- CreateEnum
CREATE TYPE "WalletEntryState" AS ENUM ('AVAILABLE', 'WITHDRAWAL_REQUESTED', 'PAID');

-- CreateTable
CREATE TABLE "SavingsWalletEntry" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "referenceValue" DECIMAL(12,2) NOT NULL,
    "actualValue" DECIMAL(12,2) NOT NULL,
    "grossSaving" DECIMAL(12,2) NOT NULL,
    "buyerShare" DECIMAL(12,2) NOT NULL,
    "state" "WalletEntryState" NOT NULL DEFAULT 'AVAILABLE',
    "withdrawalRequestedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsWalletEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavingsWalletEntry_allocationId_key" ON "SavingsWalletEntry"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsWalletEntry_paymentReference_key" ON "SavingsWalletEntry"("paymentReference");

-- CreateIndex
CREATE INDEX "SavingsWalletEntry_buyerId_state_idx" ON "SavingsWalletEntry"("buyerId", "state");

-- AddForeignKey
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
