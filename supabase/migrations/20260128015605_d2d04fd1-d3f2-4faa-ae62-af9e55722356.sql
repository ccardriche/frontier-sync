-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('shipper', 'driver', 'gig_worker', 'landowner', 'admin');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM (
  'posted', 'bidding', 'assigned', 'enroute_pickup', 
  'picked_up', 'in_transit', 'arrived', 'delivered', 'closed', 'cancelled'
);

-- Create bid status enum
CREATE TYPE public.bid_status AS ENUM ('active', 'withdrawn', 'rejected', 'accepted');

-- Create hub type enum
CREATE TYPE public.hub_type AS ENUM ('micro_hub', 'transit_stop');

-- Create fee model enum
CREATE TYPE public.fee_model AS ENUM ('per_checkin', 'daily', 'monthly', 'free');

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create ticket status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ===========================================
-- USER ROLES TABLE (separate from profiles for security)
-- ===========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SECURITY DEFINER FUNCTION for role checking (avoids RLS recursion)
-- ===========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ===========================================
-- PROFILES TABLE
-- ===========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  wallet_balance_cents BIGINT DEFAULT 0,
  vehicle_info JSONB,
  license_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- JOBS TABLE
-- ===========================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cargo_details JSONB,
  pickup_label TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  drop_label TEXT,
  drop_lat DOUBLE PRECISION,
  drop_lng DOUBLE PRECISION,
  urgency BOOLEAN DEFAULT false,
  budget_cents BIGINT,
  scheduled_pickup TIMESTAMPTZ,
  weight_kg NUMERIC,
  status job_status NOT NULL DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- BIDS TABLE
-- ===========================================
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  eta_minutes INTEGER,
  note TEXT,
  status bid_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- ASSIGNMENTS TABLE (one accepted bid per job)
-- ===========================================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- GPS LOGS TABLE (tracking)
-- ===========================================
CREATE TABLE public.gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kph DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION,
  road_quality INTEGER CHECK (road_quality >= 1 AND road_quality <= 5),
  hazard_type TEXT,
  source TEXT DEFAULT 'device',
  synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.gps_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PROOF OF DELIVERY TABLE
-- ===========================================
CREATE TABLE public.pod (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  delivered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  signature_url TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  otp_code TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pod ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HUB LISTINGS TABLE
-- ===========================================
CREATE TABLE public.hub_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_name TEXT NOT NULL,
  hub_type hub_type NOT NULL,
  location_label TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geojson JSONB,
  capacity INTEGER DEFAULT 20,
  operating_hours TEXT,
  fee_model fee_model DEFAULT 'per_checkin',
  fee_cents BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  verification_status verification_status DEFAULT 'pending',
  verification_docs TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.hub_listings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HUB CHECK-INS TABLE
-- ===========================================
CREATE TABLE public.hub_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES public.hub_listings(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('checkin', 'checkout')),
  fee_charged_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.hub_checkins ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TRANSACTIONS TABLE (wallet ledger)
-- ===========================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  hub_id UUID REFERENCES public.hub_listings(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SUPPORT TICKETS TABLE
-- ===========================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  category TEXT,
  message TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TRIGGER: Auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hub_listings_updated_at
  BEFORE UPDATE ON public.hub_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- TRIGGER: Auto-create profile on signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- RLS POLICIES: user_roles
-- ===========================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES: profiles
-- ===========================================
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===========================================
-- RLS POLICIES: jobs
-- ===========================================
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Shippers can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = shipper_id AND 
    public.has_role(auth.uid(), 'shipper')
  );

CREATE POLICY "Shippers can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can delete their own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = shipper_id AND status = 'posted');

-- ===========================================
-- RLS POLICIES: bids
-- ===========================================
CREATE POLICY "Bids are viewable by job shipper and bid driver"
  ON public.bids FOR SELECT
  USING (
    auth.uid() = driver_id OR
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Drivers can create bids"
  ON public.bids FOR INSERT
  WITH CHECK (
    auth.uid() = driver_id AND 
    (public.has_role(auth.uid(), 'driver') OR public.has_role(auth.uid(), 'gig_worker'))
  );

CREATE POLICY "Drivers can update their own bids"
  ON public.bids FOR UPDATE
  USING (auth.uid() = driver_id AND status = 'active');

-- ===========================================
-- RLS POLICIES: assignments
-- ===========================================
CREATE POLICY "Assignments viewable by involved parties"
  ON public.assignments FOR SELECT
  USING (
    auth.uid() = driver_id OR
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Shippers can create assignments for their jobs"
  ON public.assignments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Drivers can update their assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = driver_id);

-- ===========================================
-- RLS POLICIES: gps_logs
-- ===========================================
CREATE POLICY "GPS logs viewable by driver and shipper"
  ON public.gps_logs FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own GPS logs"
  ON public.gps_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- RLS POLICIES: pod
-- ===========================================
CREATE POLICY "PoD viewable by driver and shipper"
  ON public.pod FOR SELECT
  USING (
    auth.uid() = delivered_by OR
    auth.uid() IN (SELECT shipper_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Drivers can create PoD"
  ON public.pod FOR INSERT
  WITH CHECK (auth.uid() = delivered_by);

-- ===========================================
-- RLS POLICIES: hub_listings
-- ===========================================
CREATE POLICY "Active hubs are viewable by everyone"
  ON public.hub_listings FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "Landowners can create hubs"
  ON public.hub_listings FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND 
    public.has_role(auth.uid(), 'landowner')
  );

CREATE POLICY "Landowners can update their own hubs"
  ON public.hub_listings FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Landowners can delete their own hubs"
  ON public.hub_listings FOR DELETE
  USING (auth.uid() = owner_id);

-- ===========================================
-- RLS POLICIES: hub_checkins
-- ===========================================
CREATE POLICY "Hub checkins viewable by hub owner and user"
  ON public.hub_checkins FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT owner_id FROM public.hub_listings WHERE id = hub_id)
  );

CREATE POLICY "Users can create checkins"
  ON public.hub_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- RLS POLICIES: transactions
-- ===========================================
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- RLS POLICIES: support_tickets
-- ===========================================
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own open tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    public.has_role(auth.uid(), 'admin')
  );

-- ===========================================
-- INDEXES for performance
-- ===========================================
CREATE INDEX idx_jobs_shipper ON public.jobs(shipper_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_bids_job ON public.bids(job_id);
CREATE INDEX idx_bids_driver ON public.bids(driver_id);
CREATE INDEX idx_assignments_job ON public.assignments(job_id);
CREATE INDEX idx_assignments_driver ON public.assignments(driver_id);
CREATE INDEX idx_gps_logs_job ON public.gps_logs(job_id);
CREATE INDEX idx_gps_logs_user ON public.gps_logs(user_id);
CREATE INDEX idx_gps_logs_created ON public.gps_logs(created_at);
CREATE INDEX idx_hub_listings_owner ON public.hub_listings(owner_id);
CREATE INDEX idx_hub_checkins_hub ON public.hub_checkins(hub_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);