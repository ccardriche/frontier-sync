ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

CREATE TABLE IF NOT EXISTS public.load_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id uuid NOT NULL,
  source text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  jobs_created int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.load_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shippers see own imports"
  ON public.load_imports
  FOR SELECT
  USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers create own imports"
  ON public.load_imports
  FOR INSERT
  WITH CHECK (auth.uid() = shipper_id);

CREATE INDEX IF NOT EXISTS idx_load_imports_shipper ON public.load_imports(shipper_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source) WHERE source <> 'manual';