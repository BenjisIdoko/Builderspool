-- Only safe while no carved-out entries exist (delete or re-home them first).
ALTER TABLE "SavingsWalletEntry" DROP CONSTRAINT "SavingsWalletEntry_one_source_check";
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_one_source_check"
  CHECK (("allocationId" IS NULL) <> ("sheetFulfilmentId" IS NULL));
ALTER TABLE "SavingsWalletEntry" DROP CONSTRAINT "SavingsWalletEntry_originEntryId_fkey";
DROP INDEX "SavingsWalletEntry_originEntryId_idx";
ALTER TABLE "SavingsWalletEntry" DROP COLUMN "originEntryId";
