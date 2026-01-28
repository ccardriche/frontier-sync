-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Enable realtime for bids table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;