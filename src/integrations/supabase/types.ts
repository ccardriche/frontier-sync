export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          bid_id: string
          completed_at: string | null
          created_at: string
          driver_id: string
          id: string
          job_id: string
          started_at: string | null
        }
        Insert: {
          bid_id: string
          completed_at?: string | null
          created_at?: string
          driver_id: string
          id?: string
          job_id: string
          started_at?: string | null
        }
        Update: {
          bid_id?: string
          completed_at?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          job_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount_cents: number
          created_at: string
          driver_id: string
          eta_minutes: number | null
          id: string
          job_id: string
          note: string | null
          status: Database["public"]["Enums"]["bid_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          driver_id: string
          eta_minutes?: number | null
          id?: string
          job_id: string
          note?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          driver_id?: string
          eta_minutes?: number | null
          id?: string
          job_id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          availability_preferences: Json | null
          background_check_consent: boolean | null
          background_check_consent_at: string | null
          cdl_document_url: string | null
          created_at: string
          full_name: string
          government_id_url: string | null
          id: string
          license_document_url: string | null
          license_expiry: string | null
          license_number: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          mdr_document_url: string | null
          phone: string
          selfie_url: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_preferences?: Json | null
          background_check_consent?: boolean | null
          background_check_consent_at?: string | null
          cdl_document_url?: string | null
          created_at?: string
          full_name: string
          government_id_url?: string | null
          id?: string
          license_document_url?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          mdr_document_url?: string | null
          phone: string
          selfie_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_preferences?: Json | null
          background_check_consent?: boolean | null
          background_check_consent_at?: string | null
          cdl_document_url?: string | null
          created_at?: string
          full_name?: string
          government_id_url?: string | null
          id?: string
          license_document_url?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          mdr_document_url?: string | null
          phone?: string
          selfie_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      driver_vehicles: {
        Row: {
          cargo_height_m: number | null
          cargo_length_m: number | null
          cargo_width_m: number | null
          created_at: string
          driver_profile_id: string
          has_refrigeration: boolean | null
          id: string
          is_primary: boolean | null
          license_plate: string
          max_weight_kg: number
          photo_urls: string[] | null
          requires_cdl: boolean | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year: number | null
        }
        Insert: {
          cargo_height_m?: number | null
          cargo_length_m?: number | null
          cargo_width_m?: number | null
          created_at?: string
          driver_profile_id: string
          has_refrigeration?: boolean | null
          id?: string
          is_primary?: boolean | null
          license_plate: string
          max_weight_kg: number
          photo_urls?: string[] | null
          requires_cdl?: boolean | null
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year?: number | null
        }
        Update: {
          cargo_height_m?: number | null
          cargo_length_m?: number | null
          cargo_width_m?: number | null
          created_at?: string
          driver_profile_id?: string
          has_refrigeration?: boolean | null
          id?: string
          is_primary?: boolean | null
          license_plate?: string
          max_weight_kg?: number
          photo_urls?: string[] | null
          requires_cdl?: boolean | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicles_driver_profile_id_fkey"
            columns: ["driver_profile_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_logs: {
        Row: {
          accuracy_m: number | null
          created_at: string
          hazard_type: string | null
          id: string
          job_id: string | null
          lat: number
          lng: number
          road_quality: number | null
          source: string | null
          speed_kph: number | null
          synced: boolean | null
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          hazard_type?: string | null
          id?: string
          job_id?: string | null
          lat: number
          lng: number
          road_quality?: number | null
          source?: string | null
          speed_kph?: number | null
          synced?: boolean | null
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          hazard_type?: string | null
          id?: string
          job_id?: string | null
          lat?: number
          lng?: number
          road_quality?: number | null
          source?: string | null
          speed_kph?: number | null
          synced?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_checkins: {
        Row: {
          created_at: string
          event_type: string
          fee_charged_cents: number | null
          hub_id: string
          id: string
          job_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          fee_charged_cents?: number | null
          hub_id: string
          id?: string
          job_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          fee_charged_cents?: number | null
          hub_id?: string
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_checkins_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hub_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_checkins_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_listings: {
        Row: {
          capacity: number | null
          created_at: string
          fee_cents: number | null
          fee_model: Database["public"]["Enums"]["fee_model"] | null
          geojson: Json | null
          hub_name: string
          hub_type: Database["public"]["Enums"]["hub_type"]
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          location_label: string | null
          operating_hours: string | null
          owner_id: string
          security_features: Json | null
          updated_at: string
          verification_docs: string[] | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          fee_cents?: number | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          geojson?: Json | null
          hub_name: string
          hub_type: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location_label?: string | null
          operating_hours?: string | null
          owner_id: string
          security_features?: Json | null
          updated_at?: string
          verification_docs?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          fee_cents?: number | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          geojson?: Json | null
          hub_name?: string
          hub_type?: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location_label?: string | null
          operating_hours?: string | null
          owner_id?: string
          security_features?: Json | null
          updated_at?: string
          verification_docs?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      hub_units: {
        Row: {
          carrier: string | null
          created_at: string
          customer: string | null
          date_out: string | null
          hub_id: string
          id: string
          in_gate_date: string | null
          in_gate_doc: string | null
          license_plate: string | null
          make: string | null
          notes: string | null
          status: Database["public"]["Enums"]["unit_status"]
          unit_number: string
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          customer?: string | null
          date_out?: string | null
          hub_id: string
          id?: string
          in_gate_date?: string | null
          in_gate_doc?: string | null
          license_plate?: string | null
          make?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["unit_status"]
          unit_number: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          customer?: string | null
          date_out?: string | null
          hub_id?: string
          id?: string
          in_gate_date?: string | null
          in_gate_doc?: string | null
          license_plate?: string | null
          make?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["unit_status"]
          unit_number?: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_units_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hub_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stops: {
        Row: {
          completed_at: string | null
          created_at: string
          driver_notes: string | null
          id: string
          job_id: string
          label: string | null
          lat: number
          lng: number
          optimized_order: number | null
          photos: string[] | null
          sequence_order: number
          stop_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          driver_notes?: string | null
          id?: string
          job_id: string
          label?: string | null
          lat: number
          lng: number
          optimized_order?: number | null
          photos?: string[] | null
          sequence_order: number
          stop_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          driver_notes?: string | null
          id?: string
          job_id?: string
          label?: string | null
          lat?: number
          lng?: number
          optimized_order?: number | null
          photos?: string[] | null
          sequence_order?: number
          stop_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_stops_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget_cents: number | null
          cargo_details: Json | null
          cargo_type: Database["public"]["Enums"]["cargo_type"] | null
          created_at: string
          distance_km: number | null
          drop_label: string | null
          drop_lat: number | null
          drop_lng: number | null
          external_ref: string | null
          id: string
          imported_at: string | null
          max_budget_cents: number | null
          min_budget_cents: number | null
          pickup_label: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pricing_type: string
          scheduled_dropoff: string | null
          scheduled_pickup: string | null
          shipper_id: string
          source: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          urgency: boolean | null
          weight_kg: number | null
        }
        Insert: {
          budget_cents?: number | null
          cargo_details?: Json | null
          cargo_type?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          distance_km?: number | null
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          external_ref?: string | null
          id?: string
          imported_at?: string | null
          max_budget_cents?: number | null
          min_budget_cents?: number | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pricing_type?: string
          scheduled_dropoff?: string | null
          scheduled_pickup?: string | null
          shipper_id: string
          source?: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          budget_cents?: number | null
          cargo_details?: Json | null
          cargo_type?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          distance_km?: number | null
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          external_ref?: string | null
          id?: string
          imported_at?: string | null
          max_budget_cents?: number | null
          min_budget_cents?: number | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pricing_type?: string
          scheduled_dropoff?: string | null
          scheduled_pickup?: string | null
          shipper_id?: string
          source?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      landowner_profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          facility_description: string | null
          facility_photo_urls: string[] | null
          has_qr_gate_scanner: boolean | null
          has_security_cameras: boolean | null
          id: string
          insurance_document_url: string | null
          owner_name: string
          phone: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          facility_description?: string | null
          facility_photo_urls?: string[] | null
          has_qr_gate_scanner?: boolean | null
          has_security_cameras?: boolean | null
          id?: string
          insurance_document_url?: string | null
          owner_name: string
          phone: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          facility_description?: string | null
          facility_photo_urls?: string[] | null
          has_qr_gate_scanner?: boolean | null
          has_security_cameras?: boolean | null
          id?: string
          insurance_document_url?: string | null
          owner_name?: string
          phone?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      lane_watches: {
        Row: {
          created_at: string
          dest_label: string | null
          dest_radius_km: number | null
          equipment: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_imported: number | null
          last_run_status: string | null
          min_rate_cents: number | null
          name: string
          origin_label: string | null
          origin_radius_km: number | null
          owner_id: string
          sources: string[]
          total_imported: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dest_label?: string | null
          dest_radius_km?: number | null
          equipment?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_imported?: number | null
          last_run_status?: string | null
          min_rate_cents?: number | null
          name: string
          origin_label?: string | null
          origin_radius_km?: number | null
          owner_id: string
          sources?: string[]
          total_imported?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dest_label?: string | null
          dest_radius_km?: number | null
          equipment?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_imported?: number | null
          last_run_status?: string | null
          min_rate_cents?: number | null
          name?: string
          origin_label?: string | null
          origin_radius_km?: number | null
          owner_id?: string
          sources?: string[]
          total_imported?: number
          updated_at?: string
        }
        Relationships: []
      }
      load_imports: {
        Row: {
          created_at: string
          id: string
          jobs_created: number
          raw_payload: Json
          shipper_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          jobs_created?: number
          raw_payload?: Json
          shipper_id: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          jobs_created?: number
          raw_payload?: Json
          shipper_id?: string
          source?: string
        }
        Relationships: []
      }
      pod: {
        Row: {
          delivered_at: string
          delivered_by: string
          id: string
          job_id: string
          otp_code: string | null
          photo_url: string | null
          recipient_name: string | null
          recipient_phone: string | null
          signature_url: string | null
        }
        Insert: {
          delivered_at?: string
          delivered_by: string
          id?: string
          job_id: string
          otp_code?: string | null
          photo_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          signature_url?: string | null
        }
        Update: {
          delivered_at?: string
          delivered_by?: string
          id?: string
          job_id?: string
          otp_code?: string | null
          photo_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          license_url: string | null
          phone: string | null
          rating: number | null
          updated_at: string
          vehicle_info: Json | null
          verified: boolean | null
          wallet_balance_cents: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          license_url?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          vehicle_info?: Json | null
          verified?: boolean | null
          wallet_balance_cents?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          license_url?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          vehicle_info?: Json | null
          verified?: boolean | null
          wallet_balance_cents?: number | null
        }
        Relationships: []
      }
      recurring_job_templates: {
        Row: {
          budget_cents: number | null
          cadence: string
          cargo_details: Json | null
          cargo_type: Database["public"]["Enums"]["cargo_type"] | null
          created_at: string
          days_of_week: number[] | null
          drop_label: string | null
          drop_lat: number | null
          drop_lng: number | null
          id: string
          is_active: boolean | null
          last_run_date: string | null
          next_run_date: string | null
          pickup_label: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          preferred_time: string | null
          shipper_id: string
          title: string
          total_jobs_created: number | null
          updated_at: string
          urgency: boolean | null
          weight_kg: number | null
        }
        Insert: {
          budget_cents?: number | null
          cadence: string
          cargo_details?: Json | null
          cargo_type?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          days_of_week?: number[] | null
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          is_active?: boolean | null
          last_run_date?: string | null
          next_run_date?: string | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          preferred_time?: string | null
          shipper_id: string
          title: string
          total_jobs_created?: number | null
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          budget_cents?: number | null
          cadence?: string
          cargo_details?: Json | null
          cargo_type?: Database["public"]["Enums"]["cargo_type"] | null
          created_at?: string
          days_of_week?: number[] | null
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          is_active?: boolean | null
          last_run_date?: string | null
          next_run_date?: string | null
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          preferred_time?: string | null
          shipper_id?: string
          title?: string
          total_jobs_created?: number | null
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          created_at: string
          gps_accuracy_m: number | null
          id: string
          is_verified: boolean | null
          landmark_description: string | null
          lat: number
          lng: number
          location_name: string
          notes: string | null
          photo_urls: string[] | null
          updated_at: string
          usage_count: number | null
          user_id: string
          verified_address: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          gps_accuracy_m?: number | null
          id?: string
          is_verified?: boolean | null
          landmark_description?: string | null
          lat: number
          lng: number
          location_name: string
          notes?: string | null
          photo_urls?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
          verified_address?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          gps_accuracy_m?: number | null
          id?: string
          is_verified?: boolean | null
          landmark_description?: string | null
          lat?: number
          lng?: number
          location_name?: string
          notes?: string | null
          photo_urls?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          verified_address?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      shipper_profiles: {
        Row: {
          additional_needs: string | null
          bond_document_url: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          contact_person_name: string
          created_at: string
          dot_number: string | null
          ein_number: string | null
          email: string
          id: string
          insurance_document_url: string | null
          mc_number: string | null
          phone: string
          preferred_lanes: string | null
          products_shipped: Database["public"]["Enums"]["cargo_type"][] | null
          rate_preferences: string | null
          registration_number: string | null
          shipment_types: string[] | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          typical_loads: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          additional_needs?: string | null
          bond_document_url?: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          contact_person_name: string
          created_at?: string
          dot_number?: string | null
          ein_number?: string | null
          email: string
          id?: string
          insurance_document_url?: string | null
          mc_number?: string | null
          phone: string
          preferred_lanes?: string | null
          products_shipped?: Database["public"]["Enums"]["cargo_type"][] | null
          rate_preferences?: string | null
          registration_number?: string | null
          shipment_types?: string[] | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          typical_loads?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          additional_needs?: string | null
          bond_document_url?: string | null
          business_name?: string
          business_type?: Database["public"]["Enums"]["business_type"]
          contact_person_name?: string
          created_at?: string
          dot_number?: string | null
          ein_number?: string | null
          email?: string
          id?: string
          insurance_document_url?: string | null
          mc_number?: string | null
          phone?: string
          preferred_lanes?: string | null
          products_shipped?: Database["public"]["Enums"]["cargo_type"][] | null
          rate_preferences?: string | null
          registration_number?: string | null
          shipment_types?: string[] | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          typical_loads?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          id: string
          job_id: string | null
          message: string
          resolution_note: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          job_id?: string | null
          message: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          job_id?: string | null
          message?: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          direction: string
          hub_id: string | null
          id: string
          job_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          direction: string
          hub_id?: string | null
          id?: string
          job_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          direction?: string
          hub_id?: string | null
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hub_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_inspections: {
        Row: {
          additional_photo_urls: string[] | null
          all_lights_working: boolean | null
          brake_lf_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lf_tread: number | null
          brake_lr_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lr_tread: number | null
          brake_rf_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rf_tread: number | null
          brake_rr_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rr_tread: number | null
          created_at: string
          damage_amount_cents: number | null
          damage_description: string | null
          damage_status: Database["public"]["Enums"]["damage_status"]
          driver_company: string | null
          driver_email: string | null
          driver_license_photo_url: string | null
          driver_name: string | null
          estimate_file_url: string | null
          fhwa_status: Database["public"]["Enums"]["fhwa_status"] | null
          id: string
          inspector_id: string
          no_drivers_license_photo: boolean | null
          non_damage_amount_cents: number | null
          notes: string | null
          po_not_to_exceed_cents: number | null
          po_number: string | null
          po_special_instructions: string | null
          send_back_to_vendor: boolean | null
          tire_lf_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lf_tread: number | null
          tire_lr_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lr_tread: number | null
          tire_rf_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rf_tread: number | null
          tire_rr_condition:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rr_tread: number | null
          total_estimate_cents: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          additional_photo_urls?: string[] | null
          all_lights_working?: boolean | null
          brake_lf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lf_tread?: number | null
          brake_lr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lr_tread?: number | null
          brake_rf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rf_tread?: number | null
          brake_rr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rr_tread?: number | null
          created_at?: string
          damage_amount_cents?: number | null
          damage_description?: string | null
          damage_status?: Database["public"]["Enums"]["damage_status"]
          driver_company?: string | null
          driver_email?: string | null
          driver_license_photo_url?: string | null
          driver_name?: string | null
          estimate_file_url?: string | null
          fhwa_status?: Database["public"]["Enums"]["fhwa_status"] | null
          id?: string
          inspector_id: string
          no_drivers_license_photo?: boolean | null
          non_damage_amount_cents?: number | null
          notes?: string | null
          po_not_to_exceed_cents?: number | null
          po_number?: string | null
          po_special_instructions?: string | null
          send_back_to_vendor?: boolean | null
          tire_lf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lf_tread?: number | null
          tire_lr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lr_tread?: number | null
          tire_rf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rf_tread?: number | null
          tire_rr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rr_tread?: number | null
          total_estimate_cents?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          additional_photo_urls?: string[] | null
          all_lights_working?: boolean | null
          brake_lf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lf_tread?: number | null
          brake_lr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_lr_tread?: number | null
          brake_rf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rf_tread?: number | null
          brake_rr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          brake_rr_tread?: number | null
          created_at?: string
          damage_amount_cents?: number | null
          damage_description?: string | null
          damage_status?: Database["public"]["Enums"]["damage_status"]
          driver_company?: string | null
          driver_email?: string | null
          driver_license_photo_url?: string | null
          driver_name?: string | null
          estimate_file_url?: string | null
          fhwa_status?: Database["public"]["Enums"]["fhwa_status"] | null
          id?: string
          inspector_id?: string
          no_drivers_license_photo?: boolean | null
          non_damage_amount_cents?: number | null
          notes?: string | null
          po_not_to_exceed_cents?: number | null
          po_number?: string | null
          po_special_instructions?: string | null
          send_back_to_vendor?: boolean | null
          tire_lf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lf_tread?: number | null
          tire_lr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_lr_tread?: number | null
          tire_rf_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rf_tread?: number | null
          tire_rr_condition?:
            | Database["public"]["Enums"]["tire_brake_condition"]
            | null
          tire_rr_tread?: number | null
          total_estimate_cents?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "hub_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "shipper" | "driver" | "gig_worker" | "landowner" | "admin"
      bid_status: "active" | "withdrawn" | "rejected" | "accepted"
      business_type:
        | "sole_proprietor"
        | "partnership"
        | "llc"
        | "corporation"
        | "cooperative"
        | "other"
      cargo_type:
        | "small_parcels"
        | "palletized_goods"
        | "bulk_goods"
        | "mixed_freight"
        | "dry_food"
        | "perishables"
        | "frozen_goods"
        | "livestock"
        | "produce"
        | "cement"
        | "lumber"
        | "steel"
        | "pipes"
        | "heavy_machinery"
        | "furniture"
        | "appliances"
        | "electronics"
        | "clothing"
        | "fuel"
        | "chemicals_non_hazardous"
        | "minerals"
        | "raw_materials"
        | "medical_supplies"
        | "pharmaceuticals"
        | "hazardous_materials"
        | "fragile_items"
        | "oversized_loads"
        | "documents"
        | "small_packages"
        | "same_day_deliveries"
        | "furniture_light"
        | "appliances_small"
      damage_status: "no_damage" | "damaged"
      fee_model: "per_checkin" | "daily" | "monthly" | "free"
      fhwa_status: "current" | "expired" | "none"
      hub_type: "micro_hub" | "transit_stop"
      job_status:
        | "posted"
        | "bidding"
        | "assigned"
        | "enroute_pickup"
        | "picked_up"
        | "in_transit"
        | "arrived"
        | "delivered"
        | "closed"
        | "cancelled"
      license_type: "standard" | "cdl"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      tire_brake_condition:
        | "ok"
        | "cracked"
        | "oil_soaked"
        | "corrosion"
        | "bad_other"
      unit_status: "in_yard" | "out" | "on_hold" | "damaged"
      vehicle_type:
        | "car"
        | "pickup_truck"
        | "van"
        | "box_truck"
        | "flatbed"
        | "semi_truck"
        | "heavy_equipment"
        | "specialized_carrier"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["shipper", "driver", "gig_worker", "landowner", "admin"],
      bid_status: ["active", "withdrawn", "rejected", "accepted"],
      business_type: [
        "sole_proprietor",
        "partnership",
        "llc",
        "corporation",
        "cooperative",
        "other",
      ],
      cargo_type: [
        "small_parcels",
        "palletized_goods",
        "bulk_goods",
        "mixed_freight",
        "dry_food",
        "perishables",
        "frozen_goods",
        "livestock",
        "produce",
        "cement",
        "lumber",
        "steel",
        "pipes",
        "heavy_machinery",
        "furniture",
        "appliances",
        "electronics",
        "clothing",
        "fuel",
        "chemicals_non_hazardous",
        "minerals",
        "raw_materials",
        "medical_supplies",
        "pharmaceuticals",
        "hazardous_materials",
        "fragile_items",
        "oversized_loads",
        "documents",
        "small_packages",
        "same_day_deliveries",
        "furniture_light",
        "appliances_small",
      ],
      damage_status: ["no_damage", "damaged"],
      fee_model: ["per_checkin", "daily", "monthly", "free"],
      fhwa_status: ["current", "expired", "none"],
      hub_type: ["micro_hub", "transit_stop"],
      job_status: [
        "posted",
        "bidding",
        "assigned",
        "enroute_pickup",
        "picked_up",
        "in_transit",
        "arrived",
        "delivered",
        "closed",
        "cancelled",
      ],
      license_type: ["standard", "cdl"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      tire_brake_condition: [
        "ok",
        "cracked",
        "oil_soaked",
        "corrosion",
        "bad_other",
      ],
      unit_status: ["in_yard", "out", "on_hold", "damaged"],
      vehicle_type: [
        "car",
        "pickup_truck",
        "van",
        "box_truck",
        "flatbed",
        "semi_truck",
        "heavy_equipment",
        "specialized_carrier",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
