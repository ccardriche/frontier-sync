import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const testUsers = [
      { email: "shipper@test.com", password: "Test1234!", role: "shipper", full_name: "Test Shipper" },
      { email: "driver@test.com", password: "Test1234!", role: "driver", full_name: "Test Driver" },
      { email: "landowner@test.com", password: "Test1234!", role: "landowner", full_name: "Test Landowner" },
      { email: "admin@test.com", password: "Test1234!", role: "admin", full_name: "Test Admin" },
    ];

    const results = [];

    for (const u of testUsers) {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      const found = existing?.users?.find((x: any) => x.email === u.email);

      let userId: string;

      if (found) {
        userId = found.id;
        results.push({ email: u.email, status: "already exists", userId });
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (error) {
          results.push({ email: u.email, status: "error", error: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ email: u.email, status: "created", userId });
      }

      // Ensure role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", u.role)
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role });
      }

      // Ensure profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin.from("profiles").insert({ id: userId, full_name: u.full_name, phone: "+1555000" + u.role.length });
      } else {
        await supabaseAdmin.from("profiles").update({ full_name: u.full_name }).eq("id", userId);
      }

      // Create role-specific onboarding profiles
      if (u.role === "shipper") {
        const { data: ep } = await supabaseAdmin.from("shipper_profiles").select("id").eq("user_id", userId).maybeSingle();
        if (!ep) {
          await supabaseAdmin.from("shipper_profiles").insert({
            user_id: userId,
            business_name: "Test Freight Co.",
            business_type: "llc",
            contact_person_name: "Test Shipper",
            phone: "+15550001234",
            email: u.email,
            mc_number: "MC-123456",
            dot_number: "DOT-789012",
            ein_number: "12-3456789",
            products_shipped: ["small_parcels", "palletized_goods", "dry_food"],
            shipment_types: ["FTL", "LTL"],
            typical_loads: "5-10 pallets per shipment",
            preferred_lanes: "Midwest to East Coast",
            rate_preferences: "Per mile, negotiable",
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            verification_status: "approved",
            verified_at: new Date().toISOString(),
          });
        }
      }

      if (u.role === "driver") {
        const { data: ep } = await supabaseAdmin.from("driver_profiles").select("id").eq("user_id", userId).maybeSingle();
        let driverProfileId: string;
        if (!ep) {
          const { data: dp } = await supabaseAdmin.from("driver_profiles").insert({
            user_id: userId,
            full_name: "Test Driver",
            phone: "+15550005678",
            license_type: "cdl",
            license_number: "DL-98765432",
            license_expiry: "2028-12-31",
            background_check_consent: true,
            background_check_consent_at: new Date().toISOString(),
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            verification_status: "approved",
            verified_at: new Date().toISOString(),
            availability_preferences: { weekdays: true, weekends: false, overnight: true },
          }).select("id").single();
          driverProfileId = dp!.id;
        } else {
          driverProfileId = ep.id;
        }

        // Add vehicle
        const { data: ev } = await supabaseAdmin.from("driver_vehicles").select("id").eq("driver_profile_id", driverProfileId).maybeSingle();
        if (!ev) {
          await supabaseAdmin.from("driver_vehicles").insert({
            driver_profile_id: driverProfileId,
            vehicle_type: "semi_truck",
            license_plate: "TST-1234",
            max_weight_kg: 20000,
            cargo_length_m: 16,
            cargo_width_m: 2.6,
            cargo_height_m: 2.9,
            has_refrigeration: true,
            is_primary: true,
            requires_cdl: true,
            vehicle_year: 2022,
          });
        }
      }

      if (u.role === "landowner") {
        const { data: ep } = await supabaseAdmin.from("landowner_profiles").select("id").eq("user_id", userId).maybeSingle();
        if (!ep) {
          await supabaseAdmin.from("landowner_profiles").insert({
            user_id: userId,
            owner_name: "Test Landowner",
            business_name: "Safe Lot Properties LLC",
            phone: "+15550009012",
            email: u.email,
            has_security_cameras: true,
            has_qr_gate_scanner: true,
            facility_description: "Secure 2-acre lot with 24/7 surveillance, gated entry, and space for 30+ trucks.",
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            verification_status: "approved",
            verified_at: new Date().toISOString(),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
