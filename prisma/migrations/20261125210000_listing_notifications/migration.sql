-- Seller notifications when a listing is approved, rejected or goes live.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_LIVE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_REJECTED';
