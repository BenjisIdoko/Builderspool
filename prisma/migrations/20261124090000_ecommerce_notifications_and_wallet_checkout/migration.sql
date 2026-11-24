-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIRECT_ORDER_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCEPT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_PLACED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_PAID';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CART_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SAVINGS_CREDITED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISPATCH_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRICE_ALERT_REACHED';

-- AlterEnum
ALTER TYPE "WalletEntryState" ADD VALUE IF NOT EXISTS 'APPLIED_TO_ORDER';

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'SKIPPED_NO_PROVIDER', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "savingsApplied" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SavingsWalletEntry" ADD COLUMN "appliedOrderId" TEXT,
ADD COLUMN "appliedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PriceAlert" ADD COLUMN "notifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "providerRef" TEXT,
    "error" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "NotificationDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_createdAt_idx" ON "NotificationDelivery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "NotificationDelivery"("notificationId");

-- AddForeignKey
ALTER TABLE "SavingsWalletEntry" ADD CONSTRAINT "SavingsWalletEntry_appliedOrderId_fkey" FOREIGN KEY ("appliedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
