-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'CREDO');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK';
