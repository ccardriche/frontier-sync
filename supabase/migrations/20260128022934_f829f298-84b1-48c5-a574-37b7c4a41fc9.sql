-- Create stops table for multi-stop jobs
CREATE TABLE public.job_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  stop_type text NOT NULL CHECK (stop_type IN ('pickup', 'dropoff')),
  sequence_order integer NOT NULL,
  optimized_order integer,
  label text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_stops ENABLE ROW LEVEL SECURITY;

-- Stops are viewable by everyone (same as jobs)
CREATE POLICY "Stops viewable by everyone"
ON public.job_stops
FOR SELECT
USING (true);

-- Shippers can create stops for their jobs
CREATE POLICY "Shippers can create stops"
ON public.job_stops
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT shipper_id FROM public.jobs WHERE id = job_stops.job_id
  )
);

-- Shippers can update stops on their jobs
CREATE POLICY "Shippers can update stops"
ON public.job_stops
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT shipper_id FROM public.jobs WHERE id = job_stops.job_id
  )
);

-- Shippers can delete stops on their jobs
CREATE POLICY "Shippers can delete stops"
ON public.job_stops
FOR DELETE
USING (
  auth.uid() IN (
    SELECT shipper_id FROM public.jobs WHERE id = job_stops.job_id
  )
);

-- Drivers assigned to job can update stops (mark completed)
CREATE POLICY "Drivers can update assigned job stops"
ON public.job_stops
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.job_id = job_stops.job_id
    AND a.driver_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_job_stops_job_id ON public.job_stops(job_id);
CREATE INDEX idx_job_stops_sequence ON public.job_stops(job_id, sequence_order);

-- Enable realtime for stops
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_stops;