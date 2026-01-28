-- =============================================
-- ENHANCED ONBOARDING SCHEMA
-- =============================================

-- Enum for verification status (already exists, skip if error)
-- ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'pending';

-- Enum for vehicle types
CREATE TYPE public.vehicle_type AS ENUM (
  'car',
  'pickup_truck',
  'van',
  'box_truck',
  'flatbed',
  'semi_truck',
  'heavy_equipment',
  'specialized_carrier'
);

-- Enum for license types
CREATE TYPE public.license_type AS ENUM (
  'standard',
  'cdl'
);

-- Enum for business types
CREATE TYPE public.business_type AS ENUM (
  'sole_proprietor',
  'partnership',
  'llc',
  'corporation',
  'cooperative',
  'other'
);

-- Enum for cargo/freight types
CREATE TYPE public.cargo_type AS ENUM (
  -- General Freight
  'small_parcels',
  'palletized_goods',
  'bulk_goods',
  'mixed_freight',
  -- Food & Agriculture
  'dry_food',
  'perishables',
  'frozen_goods',
  'livestock',
  'produce',
  -- Construction & Industrial
  'cement',
  'lumber',
  'steel',
  'pipes',
  'heavy_machinery',
  -- Retail & Consumer
  'furniture',
  'appliances',
  'electronics',
  'clothing',
  -- Energy & Resources
  'fuel',
  'chemicals_non_hazardous',
  'minerals',
  'raw_materials',
  -- Specialty
  'medical_supplies',
  'pharmaceuticals',
  'hazardous_materials',
  'fragile_items',
  'oversized_loads',
  -- Gig-Friendly
  'documents',
  'small_packages',
  'same_day_deliveries',
  'furniture_light',
  'appliances_small'
);

-- =============================================
-- SHIPPER PROFILES TABLE
-- =============================================
CREATE TABLE public.shipper_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name text NOT NULL,
  business_type business_type NOT NULL,
  registration_number text,
  contact_person_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  products_shipped cargo_type[] DEFAULT '{}',
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamp with time zone,
  verification_status verification_status DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shipper_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shipper profile"
  ON public.shipper_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shipper profile"
  ON public.shipper_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipper profile"
  ON public.shipper_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shipper profiles"
  ON public.shipper_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shipper profiles"
  ON public.shipper_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- DRIVER PROFILES TABLE (Enhanced)
-- =============================================
CREATE TABLE public.driver_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  license_type license_type NOT NULL DEFAULT 'standard',
  license_number text,
  license_expiry date,
  license_document_url text,
  cdl_document_url text,
  government_id_url text,
  selfie_url text,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamp with time zone,
  verification_status verification_status DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  availability_preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own driver profile"
  ON public.driver_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own driver profile"
  ON public.driver_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own driver profile"
  ON public.driver_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all driver profiles"
  ON public.driver_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update driver profiles"
  ON public.driver_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- DRIVER VEHICLES TABLE
-- =============================================
CREATE TABLE public.driver_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  max_weight_kg numeric NOT NULL,
  cargo_length_m numeric,
  cargo_width_m numeric,
  cargo_height_m numeric,
  license_plate text NOT NULL,
  has_refrigeration boolean DEFAULT false,
  photo_urls text[] DEFAULT '{}',
  is_primary boolean DEFAULT false,
  requires_cdl boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own vehicles"
  ON public.driver_vehicles FOR SELECT
  USING (
    driver_profile_id IN (
      SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create their own vehicles"
  ON public.driver_vehicles FOR INSERT
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update their own vehicles"
  ON public.driver_vehicles FOR UPDATE
  USING (
    driver_profile_id IN (
      SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can delete their own vehicles"
  ON public.driver_vehicles FOR DELETE
  USING (
    driver_profile_id IN (
      SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- LANDOWNER PROFILES TABLE
-- =============================================
CREATE TABLE public.landowner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  owner_name text NOT NULL,
  business_name text,
  phone text NOT NULL,
  email text,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamp with time zone,
  verification_status verification_status DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landowner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own landowner profile"
  ON public.landowner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own landowner profile"
  ON public.landowner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own landowner profile"
  ON public.landowner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all landowner profiles"
  ON public.landowner_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update landowner profiles"
  ON public.landowner_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- SAVED LOCATIONS TABLE (Pin-based + Verified)
-- =============================================
CREATE TABLE public.saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  verified_address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  gps_accuracy_m double precision,
  landmark_description text,
  notes text,
  photo_urls text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamp with time zone,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved locations"
  ON public.saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved locations"
  ON public.saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved locations"
  ON public.saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved locations"
  ON public.saved_locations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved locations"
  ON public.saved_locations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update saved locations"
  ON public.saved_locations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- UPDATE JOBS TABLE TO USE CARGO TYPE
-- =============================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cargo_type cargo_type;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_shipper_profiles_updated_at
  BEFORE UPDATE ON public.shipper_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_vehicles_updated_at
  BEFORE UPDATE ON public.driver_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landowner_profiles_updated_at
  BEFORE UPDATE ON public.landowner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_locations_updated_at
  BEFORE UPDATE ON public.saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_shipper_profiles_user_id ON public.shipper_profiles(user_id);
CREATE INDEX idx_driver_profiles_user_id ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_vehicles_driver_id ON public.driver_vehicles(driver_profile_id);
CREATE INDEX idx_landowner_profiles_user_id ON public.landowner_profiles(user_id);
CREATE INDEX idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX idx_saved_locations_coords ON public.saved_locations(lat, lng);

-- =============================================
-- STORAGE BUCKET FOR VERIFICATION DOCUMENTS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification docs
CREATE POLICY "Users can upload their own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs' 
    AND has_role(auth.uid(), 'admin')
  );

-- Location photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-photos', 'location-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload location photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'location-photos' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view location photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'location-photos');