-- Not run by Prisma. Undoes 20261107150000_add_sheet_awards (slice C). Run only if no
-- scores or awards worth keeping exist; it drops them.
DROP TABLE "SheetAward";
DROP TABLE "SheetBidScore";
ALTER TABLE "SheetBid" DROP COLUMN "scoredAt", DROP COLUMN "totalScore";
DROP TYPE "SheetAwardStatus";
DROP TYPE "ScoreCriterion";
-- Then remove this folder's row from _prisma_migrations if it was applied.
