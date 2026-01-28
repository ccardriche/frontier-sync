-- Add security_features column to hub_listings for security feature tracking
ALTER TABLE public.hub_listings
ADD COLUMN IF NOT EXISTS security_features jsonb DEFAULT '{"guards": false, "cameras": false, "fencing": false, "lighting": false}'::jsonb;

-- Add a comment for clarity
COMMENT ON COLUMN public.hub_listings.security_features IS 'Security features: guards, cameras, fencing, lighting';

-- Enable realtime for hub_checkins to track live activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_checkins;