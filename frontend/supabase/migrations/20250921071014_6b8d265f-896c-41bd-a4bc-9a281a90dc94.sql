-- Create brick types table
CREATE TABLE public.brick_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  standard_bricks_per_punch INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pieces',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default brick types
INSERT INTO public.brick_types (type_name, standard_bricks_per_punch) VALUES 
('4-inch Brick', 8),
('6-inch Brick', 5);

-- Create bricks production table
CREATE TABLE public.bricks_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  brick_type_id UUID NOT NULL REFERENCES public.brick_types(id),
  number_of_punches INTEGER NOT NULL,
  actual_bricks_produced INTEGER NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL UNIQUE,
  current_stock_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  average_cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default materials
INSERT INTO public.materials (material_name, unit) VALUES 
('Cement', 'bags'),
('Dust', 'tons'),
('Diesel', 'liters');

-- Create material purchases table
CREATE TABLE public.material_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  material_id UUID NOT NULL REFERENCES public.materials(id),
  quantity_purchased DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_phone TEXT,
  payment_made DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material usage table
CREATE TABLE public.material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  material_id UUID NOT NULL REFERENCES public.materials(id),
  quantity_used DECIMAL(10,2) NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  brick_type_id UUID NOT NULL REFERENCES public.brick_types(id),
  quantity_sold INTEGER NOT NULL,
  rate_per_brick DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_received DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee payments table
CREATE TABLE public.employee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  employee_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Salary', 'Advance', 'Bonus', 'Incentive')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.brick_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bricks_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no auth required per specs)
CREATE POLICY "Allow all operations on brick_types" ON public.brick_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bricks_production" ON public.bricks_production FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on material_purchases" ON public.material_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on material_usage" ON public.material_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employee_payments" ON public.employee_payments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_brick_types_updated_at BEFORE UPDATE ON public.brick_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bricks_production_updated_at BEFORE UPDATE ON public.bricks_production FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_material_purchases_updated_at BEFORE UPDATE ON public.material_purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_material_usage_updated_at BEFORE UPDATE ON public.material_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_payments_updated_at BEFORE UPDATE ON public.employee_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bricks_production_date ON public.bricks_production(date);
CREATE INDEX idx_bricks_production_brick_type ON public.bricks_production(brick_type_id);
CREATE INDEX idx_material_purchases_date ON public.material_purchases(date);
CREATE INDEX idx_material_purchases_material ON public.material_purchases(material_id);
CREATE INDEX idx_material_usage_date ON public.material_usage(date);
CREATE INDEX idx_material_usage_material ON public.material_usage(material_id);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_sales_customer ON public.sales(customer_name);
CREATE INDEX idx_sales_brick_type ON public.sales(brick_type_id);
CREATE INDEX idx_employee_payments_date ON public.employee_payments(date);
CREATE INDEX idx_employee_payments_employee ON public.employee_payments(employee_name);