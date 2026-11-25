-- A savings entry can now be carved out of another one.
--
-- Why: checkout can part-spend an entry (the unused rest becomes a new available
-- entry), and a refund on a line that was part-paid with savings credit hands the
-- credit part back as a new entry. Neither has an allocation or a sheet
-- fulfilment of its own, so the old "exactly one source" check refused them.
-- Nothing in production has used savings credit yet (no wallet rows exist).

ALTER TABLE "SavingsWalletEntry" ADD COLUMN "originEntryId" TEXT;

CREATE INDEX "SavingsWalletEntry_originEntryId_idx" ON "SavingsWalletEntry"("originEntryId");

ALTER TABLE "SavingsWalletEntry"
  ADD CONSTRAINT "SavingsWalletEntry_originEntryId_fkey"
  FOREIGN KEY ("originEntryId") REFERENCES "SavingsWalletEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Either exactly one of allocation / sheet fulfilment (an earned entry), or
-- neither plus an origin entry (a carved-out entry).
ALTER TABLE "SavingsWalletEntry" DROP CONSTRAINT "SavingsWalletEntry_one_source_check";
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_one_source_check" CHECK (
  (("allocationId" IS NULL) <> ("sheetFulfilmentId" IS NULL) AND "originEntryId" IS NULL)
  OR ("allocationId" IS NULL AND "sheetFulfilmentId" IS NULL AND "originEntryId" IS NOT NULL)
);
