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

    const results: any[] = [];

    // ── 1. Find existing test user IDs for support tickets ──────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const allUsers = existingUsers?.users ?? [];
    const shipperUser = allUsers.find((u: any) => u.email === "shipper@test.com");
    const driverUser = allUsers.find((u: any) => u.email === "driver@test.com");

    // ── 2. New sample applicant users ────────────────────────────────────────
    const sampleUsers = [
      { email: "alice@freshfarms.ke",    password: "Sample1234!", full_name: "Alice Wambui",    role: "shipper"   },
      { email: "brian@elec.ke",          password: "Sample1234!", full_name: "Brian Otieno",    role: "shipper"   },
      { email: "john.driver@test.ke",    password: "Sample1234!", full_name: "John Kamau",      role: "driver"    },
      { email: "peter.driver@test.ke",   password: "Sample1234!", full_name: "Peter Njoroge",   role: "driver"    },
      { email: "samuel.driver@test.ke",  password: "Sample1234!", full_name: "Samuel Odhiambo", role: "driver"    },
      { email: "mary.land@test.ke",      password: "Sample1234!", full_name: "Mary Wanjiku",    role: "landowner" },
    ];

    const createdUserIds: Record<string, string> = {};

    for (const u of sampleUsers) {
      const found = allUsers.find((x: any) => x.email === u.email);
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

      createdUserIds[u.email] = userId;

      // Ensure profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin.from("profiles").insert({
          id: userId,
          full_name: u.full_name,
          rating: (4.0 + Math.random()).toFixed(1),
          wallet_balance_cents: Math.floor(Math.random() * 50000),
        });
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
    }

    // ── 3. Pending shipper profiles ──────────────────────────────────────────
    const shipperApplicants = [
      {
        email: "alice@freshfarms.ke",
        business_name: "Fresh Farms Kenya Ltd",
        contact_person_name: "Alice Wambui",
        phone: "+254711000001",
        business_type: "llc",
        mc_number: "MC-KE-44201",
        dot_number: "DOT-KE-88401",
        ein_number: "KE-112-334455",
        shipment_types: ["FTL", "LTL"],
        products_shipped: ["produce", "perishables", "dry_food"],
        typical_loads: "10-20 tonnes of fresh produce per trip",
        preferred_lanes: "Nairobi → Mombasa, Kisumu → Nairobi",
      },
      {
        email: "brian@elec.ke",
        business_name: "Otieno Electronics Ltd",
        contact_person_name: "Brian Otieno",
        phone: "+254722000002",
        business_type: "corporation",
        mc_number: "MC-KE-55302",
        dot_number: "DOT-KE-99502",
        ein_number: "KE-223-445566",
        shipment_types: ["LTL", "Parcel"],
        products_shipped: ["electronics", "appliances", "fragile_items"],
        typical_loads: "Mixed electronics, typically 2-5 tonnes",
        preferred_lanes: "Nairobi → Eldoret, Nakuru → Kisumu",
      },
    ];

    for (const sp of shipperApplicants) {
      const userId = createdUserIds[sp.email];
      if (!userId) continue;

      const { data: ep } = await supabaseAdmin
        .from("shipper_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ep) {
        await supabaseAdmin.from("shipper_profiles").insert({
          user_id: userId,
          business_name: sp.business_name,
          contact_person_name: sp.contact_person_name,
          phone: sp.phone,
          email: sp.email,
          business_type: sp.business_type,
          mc_number: sp.mc_number,
          dot_number: sp.dot_number,
          ein_number: sp.ein_number,
          shipment_types: sp.shipment_types,
          products_shipped: sp.products_shipped,
          typical_loads: sp.typical_loads,
          preferred_lanes: sp.preferred_lanes,
          rate_preferences: "Negotiable, prefer per-tonne rates",
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          verification_status: "pending",
        });
        results.push({ profile: "shipper_profile", email: sp.email, status: "inserted" });
      } else {
        results.push({ profile: "shipper_profile", email: sp.email, status: "already exists" });
      }
    }

    // ── 4. Pending driver profiles ───────────────────────────────────────────
    const driverApplicants = [
      {
        email: "john.driver@test.ke",
        full_name: "John Kamau",
        phone: "+254733000003",
        license_type: "cdl",
        license_number: "DL-KE-CDL-100001",
        license_expiry: "2027-06-30",
        availability_preferences: { weekdays: true, weekends: true, overnight: false },
      },
      {
        email: "peter.driver@test.ke",
        full_name: "Peter Njoroge",
        phone: "+254744000004",
        license_type: "standard",
        license_number: "DL-KE-STD-200002",
        license_expiry: "2026-09-15",
        availability_preferences: { weekdays: true, weekends: false, overnight: true },
      },
      {
        email: "samuel.driver@test.ke",
        full_name: "Samuel Odhiambo",
        phone: "+254755000005",
        license_type: "cdl",
        license_number: "DL-KE-CDL-300003",
        license_expiry: "2028-03-31",
        availability_preferences: { weekdays: false, weekends: true, overnight: true },
      },
    ];

    for (const dp of driverApplicants) {
      const userId = createdUserIds[dp.email];
      if (!userId) continue;

      const { data: ep } = await supabaseAdmin
        .from("driver_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ep) {
        const { data: newDp } = await supabaseAdmin
          .from("driver_profiles")
          .insert({
            user_id: userId,
            full_name: dp.full_name,
            phone: dp.phone,
            license_type: dp.license_type,
            license_number: dp.license_number,
            license_expiry: dp.license_expiry,
            background_check_consent: true,
            background_check_consent_at: new Date().toISOString(),
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            verification_status: "pending",
            availability_preferences: dp.availability_preferences,
          })
          .select("id")
          .single();

        if (newDp) {
          // Add a vehicle for each driver
          await supabaseAdmin.from("driver_vehicles").insert({
            driver_profile_id: newDp.id,
            vehicle_type: dp.license_type === "cdl" ? "semi_truck" : "pickup_truck",
            license_plate: `KE-${Math.floor(Math.random() * 900 + 100)}-${dp.full_name.split(" ")[1].substring(0, 3).toUpperCase()}`,
            max_weight_kg: dp.license_type === "cdl" ? 18000 : 1500,
            cargo_length_m: dp.license_type === "cdl" ? 14.5 : 2.0,
            cargo_width_m: dp.license_type === "cdl" ? 2.5 : 1.5,
            cargo_height_m: dp.license_type === "cdl" ? 2.8 : 1.2,
            has_refrigeration: false,
            is_primary: true,
            requires_cdl: dp.license_type === "cdl",
            vehicle_year: 2019 + Math.floor(Math.random() * 5),
          });
        }
        results.push({ profile: "driver_profile", email: dp.email, status: "inserted" });
      } else {
        results.push({ profile: "driver_profile", email: dp.email, status: "already exists" });
      }
    }

    // ── 5. Pending landowner profile ─────────────────────────────────────────
    const landownerEmail = "mary.land@test.ke";
    const landownerUserId = createdUserIds[landownerEmail];

    if (landownerUserId) {
      const { data: ep } = await supabaseAdmin
        .from("landowner_profiles")
        .select("id")
        .eq("user_id", landownerUserId)
        .maybeSingle();

      if (!ep) {
        await supabaseAdmin.from("landowner_profiles").insert({
          user_id: landownerUserId,
          owner_name: "Mary Wanjiku",
          business_name: "Wanjiku Secure Lots Ltd",
          phone: "+254766000006",
          email: landownerEmail,
          has_security_cameras: true,
          has_qr_gate_scanner: false,
          facility_description:
            "3-acre secure lot in Athi River Industrial Park. Fenced perimeter, 24/7 guard, CCTV, capacity for 25 heavy trucks.",
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          verification_status: "pending",
        });
        results.push({ profile: "landowner_profile", email: landownerEmail, status: "inserted" });
      } else {
        results.push({ profile: "landowner_profile", email: landownerEmail, status: "already exists" });
      }
    }

    // ── 6. Update existing users' profiles to enrich Users tab ───────────────
    if (shipperUser) {
      await supabaseAdmin.from("profiles").update({
        phone: "+254700100001",
        rating: 4.7,
        wallet_balance_cents: 128500,
        verified: true,
      }).eq("id", shipperUser.id);
    }
    if (driverUser) {
      await supabaseAdmin.from("profiles").update({
        phone: "+254700200002",
        rating: 4.9,
        wallet_balance_cents: 87300,
        verified: true,
      }).eq("id", driverUser.id);
    }

    // ── 7. Support tickets ───────────────────────────────────────────────────
    const ticketCreatorId = shipperUser?.id ?? driverUser?.id;
    const ticketCreator2Id = driverUser?.id ?? shipperUser?.id;

    if (ticketCreatorId) {
      const ticketsToInsert = [
        {
          created_by: ticketCreatorId,
          category: "payment",
          status: "open",
          message:
            "I was charged twice for Job #TRK-2041. The second charge of KES 4,500 appeared on my wallet 3 days after delivery was confirmed. Please investigate and reverse the duplicate charge.",
        },
        {
          created_by: ticketCreator2Id ?? ticketCreatorId,
          category: "damaged_goods",
          status: "in_progress",
          message:
            "My shipment of electronics (Job #TRK-1988) arrived with 3 broken units. The driver did not wrap them properly despite my explicit cargo fragility instructions. Requesting compensation of KES 23,000.",
        },
        {
          created_by: ticketCreatorId,
          category: "account",
          status: "open",
          message:
            "I cannot update my business registration number. The field shows a validation error for any format I try, including the one on my official KRA certificate: PVT-2021-KE-448821.",
        },
        {
          created_by: ticketCreator2Id ?? ticketCreatorId,
          category: "driver_conduct",
          status: "open",
          message:
            "The driver assigned to Job #TRK-2055 was very rude during pickup and refused to sign the goods receipt form. I have photos and witness accounts. This is unacceptable behavior and should be investigated.",
        },
        {
          created_by: ticketCreatorId,
          category: "hub_availability",
          status: "resolved",
          message:
            "The Athi River hub showed as available on the map but was full when our driver arrived. We lost 2 hours finding alternative parking. The map availability needs to update in real-time.",
          resolution_note:
            "Hub capacity system has been updated to reflect real-time occupancy. The landowner has been notified to enable live check-in scanning to trigger automatic capacity updates.",
        },
      ];

      for (const ticket of ticketsToInsert) {
        // Check if a similar ticket exists (by category + created_by)
        const { data: existing } = await supabaseAdmin
          .from("support_tickets")
          .select("id")
          .eq("created_by", ticket.created_by)
          .eq("category", ticket.category)
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from("support_tickets").insert(ticket);
          results.push({ ticket: ticket.category, status: "inserted" });
        } else {
          results.push({ ticket: ticket.category, status: "already exists" });
        }
      }
    } else {
      results.push({ tickets: "skipped", reason: "No existing test user found for created_by" });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
