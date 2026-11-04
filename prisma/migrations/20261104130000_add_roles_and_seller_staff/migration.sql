-- Idempotent so it can be applied by hand when the migrate connection is down.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SELLER_STAFF';

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'QC_OFFICER';

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FULFILMENT_OPERATOR';

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DELIVERY_PARTNER';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "SellerStaff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerStaff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SellerStaff_userId_key" ON "SellerStaff"("userId");

CREATE INDEX IF NOT EXISTS "SellerStaff_sellerUserId_idx" ON "SellerStaff"("sellerUserId");

DO $$ BEGIN
    ALTER TABLE "SellerStaff" ADD CONSTRAINT "SellerStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "SellerStaff" ADD CONSTRAINT "SellerStaff_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
