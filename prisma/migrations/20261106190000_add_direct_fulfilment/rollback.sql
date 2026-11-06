-- Manual rollback for 20261106190000_add_direct_fulfilment. NOT run by Prisma.
-- Safe only while no order line is DIRECT; otherwise those lines lose their seller records.
DROP TABLE IF EXISTS "DirectFulfilment";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "mode";
DROP TYPE IF EXISTS "DirectStatus";
DROP TYPE IF EXISTS "PurchaseMode";
