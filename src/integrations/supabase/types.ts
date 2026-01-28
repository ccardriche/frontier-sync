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
          updated_at?: string
          verification_docs?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      job_stops: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          job_id: string
          label: string | null
          lat: number
          lng: number
          optimized_order: number | null
          sequence_order: number
          stop_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          label?: string | null
          lat: number
          lng: number
          optimized_order?: number | null
          sequence_order: number
          stop_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          label?: string | null
          lat?: number
          lng?: number
          optimized_order?: number | null
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
          created_at: string
          drop_label: string | null
          drop_lat: number | null
          drop_lng: number | null
          id: string
          pickup_label: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          scheduled_pickup: string | null
          shipper_id: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          urgency: boolean | null
          weight_kg: number | null
        }
        Insert: {
          budget_cents?: number | null
          cargo_details?: Json | null
          created_at?: string
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          scheduled_pickup?: string | null
          shipper_id: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          budget_cents?: number | null
          cargo_details?: Json | null
          created_at?: string
          drop_label?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          pickup_label?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          scheduled_pickup?: string | null
          shipper_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          urgency?: boolean | null
          weight_kg?: number | null
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
      fee_model: "per_checkin" | "daily" | "monthly" | "free"
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
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      fee_model: ["per_checkin", "daily", "monthly", "free"],
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
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
