-- Allow shippers to update bids on their jobs (to accept/reject them)
CREATE POLICY "Shippers can update bids on their jobs"
  ON public.bids FOR UPDATE
  USING (
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id)
  );