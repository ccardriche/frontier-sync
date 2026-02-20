
-- =============================================
-- DRIVER PROFILES: Add MDR, Checkr consent, vehicle year
-- =============================================
ALTER TABLE public.driver_profiles
  ADD COLUMN IF NOT EXISTS mdr_document_url text,
  ADD COLUMN IF NOT EXISTS background_check_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_consent_at timestamptz;

-- =============================================
-- DRIVER VEHICLES: Add vehicle year
-- =============================================
ALTER TABLE public.driver_vehicles
  ADD COLUMN IF NOT EXISTS vehicle_year integer;

-- =============================================
-- SHIPPER PROFILES: Add MC, DOT, EIN, insurance, loads/lanes/rates
-- =============================================
ALTER TABLE public.shipper_profiles
  ADD COLUMN IF NOT EXISTS mc_number text,
  ADD COLUMN IF NOT EXISTS dot_number text,
  ADD COLUMN IF NOT EXISTS ein_number text,
  ADD COLUMN IF NOT EXISTS insurance_document_url text,
  ADD COLUMN IF NOT EXISTS bond_document_url text,
  ADD COLUMN IF NOT EXISTS shipment_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS typical_loads text,
  ADD COLUMN IF NOT EXISTS preferred_lanes text,
  ADD COLUMN IF NOT EXISTS rate_preferences text,
  ADD COLUMN IF NOT EXISTS additional_needs text;

-- =============================================
-- LANDOWNER PROFILES: Add insurance, security features, facility docs
-- =============================================
ALTER TABLE public.landowner_profiles
  ADD COLUMN IF NOT EXISTS insurance_document_url text,
  ADD COLUMN IF NOT EXISTS has_security_cameras boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_qr_gate_scanner boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS facility_photo_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facility_description text;
