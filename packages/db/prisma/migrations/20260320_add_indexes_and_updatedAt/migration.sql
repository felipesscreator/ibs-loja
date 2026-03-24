-- Migration: add_indexes_and_updatedAt
-- Add updatedAt to Sale table and create indexes

-- Add updatedAt column to Sale if not exists
ALTER TABLE "sale" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes (will fail silently if already exist)
CREATE INDEX IF NOT EXISTS "Supplier_name_idx" ON "supplier"("name");
CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "product"("supplierId");
CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "product"("name");
CREATE INDEX IF NOT EXISTS "Sale_userId_idx" ON "sale"("userId");
CREATE INDEX IF NOT EXISTS "Sale_createdAt_idx" ON "sale"("createdAt");
CREATE INDEX IF NOT EXISTS "SaleItem_productId_idx" ON "sale_item"("productId");
CREATE INDEX IF NOT EXISTS "SaleItem_saleId_idx" ON "sale_item"("saleId");
