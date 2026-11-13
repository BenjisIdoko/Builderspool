-- CreateEnum
CREATE TYPE "BankChangeStatus" AS ENUM ('OTP_PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BankChangeRequest" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "newBankName" TEXT NOT NULL,
    "newAccountNumber" TEXT NOT NULL,
    "newAccountName" TEXT NOT NULL,
    "oldBankName" TEXT,
    "oldAccountNumber" TEXT,
    "oldAccountName" TEXT,
    "nameMatch" TEXT,
    "status" "BankChangeStatus" NOT NULL DEFAULT 'OTP_PENDING',
    "otpHash" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "otpSentCount" INTEGER NOT NULL DEFAULT 1,
    "otpLastSentAt" TIMESTAMP(3),
    "otpVerifiedAt" TIMESTAMP(3),
    "callRequired" BOOLEAN NOT NULL DEFAULT false,
    "callCompletedAt" TIMESTAMP(3),
    "callNote" TEXT,
    "callById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankChangeRequest_sellerId_status_idx" ON "BankChangeRequest"("sellerId", "status");

-- CreateIndex
CREATE INDEX "BankChangeRequest_status_idx" ON "BankChangeRequest"("status");

-- AddForeignKey
ALTER TABLE "BankChangeRequest" ADD CONSTRAINT "BankChangeRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
