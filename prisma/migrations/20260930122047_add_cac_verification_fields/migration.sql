-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "cacVerificationError" TEXT,
ADD COLUMN     "cacVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "cacVerifiedCompanyName" TEXT,
ADD COLUMN     "cacVerifiedEntityType" TEXT,
ADD COLUMN     "cacVerifiedStatus" TEXT;
