CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.lane_watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  sources TEXT[] NOT NULL DEFAULT ARRAY['trulos']::TEXT[],
  origin_label TEXT,
  origin_radius_km INTEGER DEFAULT 80,
  dest_label TEXT,
  dest_radius_km INTEGER DEFAULT 80,
  equipment TEXT,
  min_rate_cents BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_imported INTEGER DEFAULT 0,
  total_imported INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lane_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own lane watches"
  ON public.lane_watches FOR SELECT
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can create lane watches"
  ON public.lane_watches FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own lane watches"
  ON public.lane_watches FOR UPDATE
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete their own lane watches"
  ON public.lane_watches FOR DELETE
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_lane_watches_updated_at
  BEFORE UPDATE ON public.lane_watches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX idx_jobs_source_external_ref
  ON public.jobs (source, external_ref)
  WHERE external_ref IS NOT NULL;