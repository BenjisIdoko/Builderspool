-- Defense in depth for checkout quantity validation (lib/checkout/createOrder.ts):
-- a non-positive quantity would reduce an order's computed total.
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0);
