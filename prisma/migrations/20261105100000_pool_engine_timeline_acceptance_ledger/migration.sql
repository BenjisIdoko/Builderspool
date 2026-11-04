-- Idempotent so it can be applied by hand when the migrate connection is down.
ALTER TYPE "CycleStatus" ADD VALUE IF NOT EXISTS 'BIDDING';

DO $$ BEGIN
    CREATE TYPE "LedgerAccount" AS ENUM ('BUYER_SAVINGS_CREDIT', 'PLATFORM_SAVINGS_SHARE', 'SELLER_PAYABLE', 'BUYER_REFUND_DUE', 'PLATFORM_COMMISSION', 'PLATFORM_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "poolClosesAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "bidsCloseAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "acceptDeadlineAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "fallbackAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "frozenAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "awardedAt" TIMESTAMP(3);
ALTER TABLE "BidCycle" ADD COLUMN IF NOT EXISTS "fallbackProcessedAt" TIMESTAMP(3);

ALTER TABLE "Bid" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "Allocation" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Allocation" ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3);
ALTER TABLE "Allocation" ADD COLUMN IF NOT EXISTS "acceptDeadlineAt" TIMESTAMP(3);
ALTER TABLE "Allocation" ADD COLUMN IF NOT EXISTS "cascadeRound" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Allocation" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "unfilledQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "LedgerEntry" (
    "id" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "allocationId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LedgerEntry_entryKey_key" ON "LedgerEntry"("entryKey");
CREATE INDEX IF NOT EXISTS "LedgerEntry_account_createdAt_idx" ON "LedgerEntry"("account", "createdAt");
CREATE INDEX IF NOT EXISTS "LedgerEntry_allocationId_idx" ON "LedgerEntry"("allocationId");
CREATE INDEX IF NOT EXISTS "LedgerEntry_userId_idx" ON "LedgerEntry"("userId");

CREATE OR REPLACE FUNCTION ledger_entry_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'LedgerEntry is append-only: add a compensating entry instead of changing or deleting one';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_entry_no_update ON "LedgerEntry";

CREATE TRIGGER ledger_entry_no_update BEFORE UPDATE OR DELETE ON "LedgerEntry" FOR EACH ROW EXECUTE FUNCTION ledger_entry_append_only();
