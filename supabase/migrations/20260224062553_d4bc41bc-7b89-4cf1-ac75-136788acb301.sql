-- Add Stripe Connect fields to driver_profiles
ALTER TABLE public.driver_profiles ADD COLUMN stripe_account_id TEXT;
ALTER TABLE public.driver_profiles ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT false;