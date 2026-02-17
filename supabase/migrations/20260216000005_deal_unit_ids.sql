-- Replace deals.unit_id (single FK) with deals.unit_ids (bigint array)
-- to support multiple property units per deal.

-- 1. Add the new array column
ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS "unit_ids" bigint[] DEFAULT '{}';

-- 2. Back-fill from existing unit_id
UPDATE "public"."deals" SET unit_ids = ARRAY[unit_id] WHERE unit_id IS NOT NULL;

-- 3. Drop the old FK constraint and column
ALTER TABLE "public"."deals" DROP CONSTRAINT IF EXISTS "deals_unit_id_fkey";
ALTER TABLE "public"."deals" DROP COLUMN IF EXISTS "unit_id";
