ALTER TABLE "products" ADD COLUMN "supplierId" TEXT;
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
