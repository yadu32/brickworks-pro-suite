-- Create factory_rates table for managing piece-rate wages
CREATE TABLE public.factory_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('production_per_punch', 'loading_per_brick')),
  brick_type_id UUID REFERENCES public.brick_types(id),
  rate_amount NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.factory_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for factory_rates
CREATE POLICY "Allow all operations on factory_rates" 
ON public.factory_rates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_factory_rates_updated_at
BEFORE UPDATE ON public.factory_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rates (global rates not tied to specific brick types)
INSERT INTO public.factory_rates (rate_type, rate_amount, brick_type_id) VALUES
('production_per_punch', 15.00, NULL),
('loading_per_brick', 2.00, NULL);

-- Create index for faster lookups
CREATE INDEX idx_factory_rates_active ON public.factory_rates(is_active, effective_date DESC) WHERE is_active = true;
CREATE INDEX idx_factory_rates_type ON public.factory_rates(rate_type);