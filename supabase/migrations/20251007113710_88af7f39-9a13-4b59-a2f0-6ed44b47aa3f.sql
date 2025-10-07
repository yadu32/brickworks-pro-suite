-- Create other_expenses table to replace maintenance tracking
CREATE TABLE public.other_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('transport', 'utilities', 'office_salaries', 'repairs', 'miscellaneous')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  vendor_name TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.other_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on other_expenses" 
ON public.other_expenses 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_other_expenses_updated_at
BEFORE UPDATE ON public.other_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop maintenance tables if they exist (cleanup)
DROP TABLE IF EXISTS public.maintenance_tickets CASCADE;
DROP TABLE IF EXISTS public.machine_assets CASCADE;