-- AlterTable
-- Each person can turn off email and text message (SMS) alerts. In-app alerts are always on.
-- WhatsApp is opt-in: Meta requires a person to agree before a business messages them there.
ALTER TABLE "User" ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySms" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false;
