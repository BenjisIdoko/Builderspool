-- CreateEnum
CREATE TYPE "ScoreCriterion" AS ENUM ('PRICE', 'PERFORMANCE', 'CAPACITY', 'DELIVERY', 'GEOGRAPHY', 'RESPONSIVENESS');

-- CreateEnum
CREATE TYPE "SheetAwardStatus" AS ENUM ('WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "SheetBid" ADD COLUMN     "scoredAt" TIMESTAMP(3),
ADD COLUMN     "totalScore" DECIMAL(6,2);

-- CreateTable
CREATE TABLE "SheetBidScore" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "criterion" "ScoreCriterion" NOT NULL,
    "weight" INTEGER NOT NULL,
    "points" DECIMAL(6,2) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "SheetBidScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetAward" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "SheetAwardStatus" NOT NULL DEFAULT 'WAITING',
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SheetBidScore_bidId_criterion_key" ON "SheetBidScore"("bidId", "criterion");

-- CreateIndex
CREATE UNIQUE INDEX "SheetAward_bidId_key" ON "SheetAward"("bidId");

-- CreateIndex
CREATE INDEX "SheetAward_status_expiresAt_idx" ON "SheetAward"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SheetAward_sheetId_rank_key" ON "SheetAward"("sheetId", "rank");

-- AddForeignKey
ALTER TABLE "SheetBidScore" ADD CONSTRAINT "SheetBidScore_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "SheetBid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetAward" ADD CONSTRAINT "SheetAward_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "PoolSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetAward" ADD CONSTRAINT "SheetAward_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "SheetBid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
