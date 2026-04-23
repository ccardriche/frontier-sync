-- Load sources registry
CREATE TABLE public.load_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('json', 'csv', 'rss', 'scrape', 'manual', 'api')),
  feed_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'basic')),
  api_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  field_mapping_json JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.load_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage load sources"
  ON public.load_sources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Active sources viewable by all authenticated"
  ON public.load_sources FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_load_sources_updated_at
  BEFORE UPDATE ON public.load_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- External loads table
CREATE TABLE public.external_loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_load_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT,
  title TEXT,
  origin_city TEXT,
  origin_state TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_city TEXT,
  destination_state TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  pickup_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  equipment_type TEXT,
  weight_lbs NUMERIC,
  miles NUMERIC,
  rate_cents BIGINT,
  broker_name TEXT,
  broker_phone TEXT,
  broker_email TEXT,
  external_url TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'booked', 'removed')),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_name, external_load_id)
);

CREATE INDEX idx_external_loads_status ON public.external_loads(status);
CREATE INDEX idx_external_loads_pickup ON public.external_loads(pickup_date);
CREATE INDEX idx_external_loads_origin ON public.external_loads(origin_state, origin_city);
CREATE INDEX idx_external_loads_dest ON public.external_loads(destination_state, destination_city);

ALTER TABLE public.external_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External loads viewable by everyone"
  ON public.external_loads FOR SELECT
  USING (true);

CREATE POLICY "Admins manage external loads"
  ON public.external_loads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sync logs
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.load_sources(id) ON DELETE CASCADE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'partial', 'failed')),
  records_added INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_logs_source ON public.sync_logs(source_id, synced_at DESC);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sync logs"
  ON public.sync_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));