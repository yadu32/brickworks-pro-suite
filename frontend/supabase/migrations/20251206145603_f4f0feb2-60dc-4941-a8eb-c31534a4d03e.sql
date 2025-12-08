-- Add subscription columns to factories table
ALTER TABLE public.factories
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS plan_expiry_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS plan_type text;

-- Add check constraint for subscription_status
ALTER TABLE public.factories
ADD CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('trial', 'active', 'expired'));

-- Add check constraint for plan_type
ALTER TABLE public.factories
ADD CONSTRAINT valid_plan_type CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'yearly'));

-- Update existing factories to have trial_ends_at set
UPDATE public.factories
SET trial_ends_at = created_at + interval '30 days'
WHERE trial_ends_at IS NULL;