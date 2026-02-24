ALTER TABLE public.job_stops 
  ADD COLUMN IF NOT EXISTS driver_notes TEXT,
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';