-- Drop the incorrect foreign key constraint that references brick_types
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_brick_type_id_fkey;

-- The correct constraint fk_sales_product to product_definitions should remain