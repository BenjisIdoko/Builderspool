-- Not run by Prisma. Undoes 20261107190000_add_sheet_fulfilment (slice D).
-- Run only if no sheet fulfilments or sheet-based savings entries exist, or you accept losing them.
ALTER TABLE "SavingsWalletEntry" DROP CONSTRAINT "SavingsWalletEntry_one_source_check";
ALTER TABLE "SavingsWalletEntry" DROP CONSTRAINT "SavingsWalletEntry_sheetFulfilmentId_fkey";
DELETE FROM "SavingsWalletEntry" WHERE "allocationId" IS NULL; -- sheet-based entries (restores NOT NULL below)
DROP INDEX "SavingsWalletEntry_sheetFulfilmentId_key";
ALTER TABLE "SavingsWalletEntry" DROP COLUMN "sheetFulfilmentId", ALTER COLUMN "allocationId" SET NOT NULL;
DROP TABLE "SheetFulfilment";
ALTER TABLE "PoolSheet" DROP COLUMN "settledAt";
DROP TYPE "SheetFulfilmentStatus";
-- PostgreSQL cannot drop enum values: SHEET_OPENED and SHEET_OFFERED stay on "NotificationType"; they are unused and harmless.
-- Then remove this folder's row from _prisma_migrations if it was applied.
