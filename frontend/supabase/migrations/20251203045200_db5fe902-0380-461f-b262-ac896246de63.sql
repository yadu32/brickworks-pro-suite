-- Drop overly permissive "Allow all operations" policies and keep factory-scoped ones

-- brick_types: Keep as is (global types)
-- bricks_production: Make factory-scoped (currently uses brick_type_id, needs factory_id)

-- Add factory_id to bricks_production if not exists
ALTER TABLE public.bricks_production ADD COLUMN IF NOT EXISTS factory_id uuid REFERENCES public.factories(id);

-- Drop permissive policies and recreate factory-scoped ones
DROP POLICY IF EXISTS "Allow all operations on brick_types" ON public.brick_types;
DROP POLICY IF EXISTS "Allow all operations on bricks_production" ON public.bricks_production;
DROP POLICY IF EXISTS "Allow all operations on employee_payments" ON public.employee_payments;
DROP POLICY IF EXISTS "Allow all operations on material_purchases" ON public.material_purchases;
DROP POLICY IF EXISTS "Allow all operations on material_usage" ON public.material_usage;
DROP POLICY IF EXISTS "Allow all operations on materials" ON public.materials;
DROP POLICY IF EXISTS "Allow all operations on other_expenses" ON public.other_expenses;
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations on factory_rates" ON public.factory_rates;

-- brick_types: Allow authenticated users to view all active brick types (global reference data)
CREATE POLICY "Authenticated users can view brick types"
ON public.brick_types FOR SELECT
TO authenticated
USING (true);

-- bricks_production: Factory-scoped
CREATE POLICY "Factory owners manage production"
ON public.bricks_production FOR ALL
USING (factory_id IN (SELECT id FROM factories WHERE owner_id = auth.uid()))
WITH CHECK (factory_id IN (SELECT id FROM factories WHERE owner_id = auth.uid()));

-- Create a security definer function to get user's factory_id
CREATE OR REPLACE FUNCTION public.get_user_factory_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.factories WHERE owner_id = auth.uid() LIMIT 1;
$$;