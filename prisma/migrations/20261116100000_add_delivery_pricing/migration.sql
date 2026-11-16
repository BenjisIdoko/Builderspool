-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "longestSideM" DECIMAL(6,2),
ADD COLUMN     "unitWeightKg" DECIMAL(10,3),
ADD COLUMN     "weightConfirmedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FulfillmentCenter" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryLatitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryLongitude" DOUBLE PRECISION,
ADD COLUMN     "deliveryQuote" JSONB;

-- CreateTable
CREATE TABLE "VehicleClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxLoadKg" INTEGER NOT NULL,
    "maxLengthM" DECIMAL(6,2),
    "ratePerKm" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleClass_name_key" ON "VehicleClass"("name");

-- The four starting classes. Capacities and lengths are physical estimates for the business to confirm;
-- the rate per km is left empty on purpose, because it is the business's number. A class without a rate is not used.
INSERT INTO "VehicleClass" ("id", "name", "maxLoadKg", "maxLengthM", "sortOrder") VALUES
  ('vc_cargo_tricycle', 'Cargo tricycle', 500, 2.50, 1),
  ('vc_pickup_van', 'Pickup / small van', 1500, 3.50, 2),
  ('vc_dropside_truck', 'Dropside truck', 5000, 6.00, 3),
  ('vc_flatbed_truck', 'Flatbed truck', 10000, 12.50, 4)
ON CONFLICT DO NOTHING;
