-- Idempotent so it can be applied by hand when the migrate connection is down.
ALTER TYPE "KycStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "tin" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "businessAddress" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "bankNameMatch" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "documentExpiresAt" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;

CREATE TABLE IF NOT EXISTS "SellerTermsAcceptance" (
    "id" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerTermsAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SellerTermsAcceptance_sellerUserId_version_idx" ON "SellerTermsAcceptance"("sellerUserId", "version");
