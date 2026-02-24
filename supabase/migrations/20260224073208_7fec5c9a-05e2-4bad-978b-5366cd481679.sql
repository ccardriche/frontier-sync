ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS scheduled_dropoff timestamptz,
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'bid',
  ADD COLUMN IF NOT EXISTS max_budget_cents bigint,
  ADD COLUMN IF NOT EXISTS min_budget_cents bigint;