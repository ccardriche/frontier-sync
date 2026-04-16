-- Enums for inspection conditions
CREATE TYPE public.unit_status AS ENUM ('in_yard', 'out', 'on_hold', 'damaged');
CREATE TYPE public.tire_brake_condition AS ENUM ('ok', 'cracked', 'oil_soaked', 'corrosion', 'bad_other');
CREATE TYPE public.damage_status AS ENUM ('no_damage', 'damaged');
CREATE TYPE public.fhwa_status AS ENUM ('current', 'expired', 'none');

-- Units stored at a hub (inventory)
CREATE TABLE public.hub_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hub_id UUID NOT NULL REFERENCES public.hub_listings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  vin TEXT,
  year INTEGER,
  make TEXT,
  license_plate TEXT,
  customer TEXT,
  carrier TEXT,
  in_gate_date DATE,
  in_gate_doc TEXT,
  date_out DATE,
  status public.unit_status NOT NULL DEFAULT 'in_yard',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_units_hub_id ON public.hub_units(hub_id);
CREATE INDEX idx_hub_units_status ON public.hub_units(status);

ALTER TABLE public.hub_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hub owners can view their units"
  ON public.hub_units FOR SELECT
  USING (
    auth.uid() IN (SELECT owner_id FROM public.hub_listings WHERE id = hub_units.hub_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Hub owners can insert units"
  ON public.hub_units FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM public.hub_listings WHERE id = hub_units.hub_id)
  );

CREATE POLICY "Hub owners can update their units"
  ON public.hub_units FOR UPDATE
  USING (
    auth.uid() IN (SELECT owner_id FROM public.hub_listings WHERE id = hub_units.hub_id)
  );

CREATE POLICY "Hub owners can delete their units"
  ON public.hub_units FOR DELETE
  USING (
    auth.uid() IN (SELECT owner_id FROM public.hub_listings WHERE id = hub_units.hub_id)
  );

CREATE TRIGGER update_hub_units_updated_at
  BEFORE UPDATE ON public.hub_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inspections per unit
CREATE TABLE public.unit_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.hub_units(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL,
  -- Driver paperwork
  driver_name TEXT,
  driver_company TEXT,
  driver_email TEXT,
  driver_license_photo_url TEXT,
  no_drivers_license_photo BOOLEAN DEFAULT false,
  -- Tires (8ths remaining 1-8 + condition)
  tire_lf_tread INTEGER CHECK (tire_lf_tread BETWEEN 1 AND 8),
  tire_lf_condition public.tire_brake_condition,
  tire_lr_tread INTEGER CHECK (tire_lr_tread BETWEEN 1 AND 8),
  tire_lr_condition public.tire_brake_condition,
  tire_rf_tread INTEGER CHECK (tire_rf_tread BETWEEN 1 AND 8),
  tire_rf_condition public.tire_brake_condition,
  tire_rr_tread INTEGER CHECK (tire_rr_tread BETWEEN 1 AND 8),
  tire_rr_condition public.tire_brake_condition,
  -- Brakes (8ths remaining 1-8 + condition)
  brake_lf_tread INTEGER CHECK (brake_lf_tread BETWEEN 1 AND 8),
  brake_lf_condition public.tire_brake_condition,
  brake_lr_tread INTEGER CHECK (brake_lr_tread BETWEEN 1 AND 8),
  brake_lr_condition public.tire_brake_condition,
  brake_rf_tread INTEGER CHECK (brake_rf_tread BETWEEN 1 AND 8),
  brake_rf_condition public.tire_brake_condition,
  brake_rr_tread INTEGER CHECK (brake_rr_tread BETWEEN 1 AND 8),
  brake_rr_condition public.tire_brake_condition,
  -- Lights & FHWA
  all_lights_working BOOLEAN,
  fhwa_status public.fhwa_status DEFAULT 'none',
  -- Damage / Estimate
  damage_status public.damage_status NOT NULL DEFAULT 'no_damage',
  damage_description TEXT,
  total_estimate_cents BIGINT DEFAULT 0,
  damage_amount_cents BIGINT DEFAULT 0,
  non_damage_amount_cents BIGINT DEFAULT 0,
  estimate_file_url TEXT,
  po_number TEXT,
  po_not_to_exceed_cents BIGINT,
  po_special_instructions TEXT,
  send_back_to_vendor BOOLEAN DEFAULT false,
  additional_photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_unit_inspections_unit_id ON public.unit_inspections(unit_id);

ALTER TABLE public.unit_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hub owners can view inspections"
  ON public.unit_inspections FOR SELECT
  USING (
    auth.uid() IN (
      SELECT hl.owner_id FROM public.hub_listings hl
      JOIN public.hub_units hu ON hu.hub_id = hl.id
      WHERE hu.id = unit_inspections.unit_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Hub owners can insert inspections"
  ON public.unit_inspections FOR INSERT
  WITH CHECK (
    auth.uid() = inspector_id
    AND auth.uid() IN (
      SELECT hl.owner_id FROM public.hub_listings hl
      JOIN public.hub_units hu ON hu.hub_id = hl.id
      WHERE hu.id = unit_inspections.unit_id
    )
  );

CREATE POLICY "Hub owners can update inspections"
  ON public.unit_inspections FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT hl.owner_id FROM public.hub_listings hl
      JOIN public.hub_units hu ON hu.hub_id = hl.id
      WHERE hu.id = unit_inspections.unit_id
    )
  );

CREATE POLICY "Hub owners can delete inspections"
  ON public.unit_inspections FOR DELETE
  USING (
    auth.uid() IN (
      SELECT hl.owner_id FROM public.hub_listings hl
      JOIN public.hub_units hu ON hu.hub_id = hl.id
      WHERE hu.id = unit_inspections.unit_id
    )
  );

CREATE TRIGGER update_unit_inspections_updated_at
  BEFORE UPDATE ON public.unit_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();