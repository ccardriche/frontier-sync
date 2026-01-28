-- Create recurring job templates table
CREATE TABLE public.recurring_job_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL,
  title TEXT NOT NULL,
  cargo_type public.cargo_type,
  cargo_details JSONB,
  pickup_label TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  drop_label TEXT,
  drop_lat DOUBLE PRECISION,
  drop_lng DOUBLE PRECISION,
  weight_kg NUMERIC,
  budget_cents BIGINT,
  urgency BOOLEAN DEFAULT false,
  -- Recurrence settings
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'biweekly', 'monthly')),
  days_of_week INTEGER[] DEFAULT '{}', -- 0=Sunday, 1=Monday, etc. for weekly
  preferred_time TIME,
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  next_run_date DATE,
  last_run_date DATE,
  total_jobs_created INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_job_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Shippers can view their own templates"
ON public.recurring_job_templates
FOR SELECT
USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can create their own templates"
ON public.recurring_job_templates
FOR INSERT
WITH CHECK (auth.uid() = shipper_id AND has_role(auth.uid(), 'shipper'));

CREATE POLICY "Shippers can update their own templates"
ON public.recurring_job_templates
FOR UPDATE
USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can delete their own templates"
ON public.recurring_job_templates
FOR DELETE
USING (auth.uid() = shipper_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recurring_job_templates_updated_at
BEFORE UPDATE ON public.recurring_job_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient querying
CREATE INDEX idx_recurring_templates_shipper ON public.recurring_job_templates(shipper_id);
CREATE INDEX idx_recurring_templates_next_run ON public.recurring_job_templates(next_run_date) WHERE is_active = true;