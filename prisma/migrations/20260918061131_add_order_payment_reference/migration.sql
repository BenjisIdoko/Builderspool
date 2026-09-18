-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
