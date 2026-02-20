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
      // Check if user already exists
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
        await supabaseAdmin.from("profiles").insert({ id: userId, full_name: u.full_name });
      } else {
        await supabaseAdmin.from("profiles").update({ full_name: u.full_name }).eq("id", userId);
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
