-- CreateEnum
CREATE TYPE "SourcingStatus" AS ENUM ('OPEN', 'SOURCED', 'REFUNDED');

-- CreateTable
CREATE TABLE "OpsSourcing" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SourcingStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "OpsSourcing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsSourcing_orderItemId_key" ON "OpsSourcing"("orderItemId");

-- CreateIndex
CREATE INDEX "OpsSourcing_status_createdAt_idx" ON "OpsSourcing"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OpsSourcing" ADD CONSTRAINT "OpsSourcing_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

