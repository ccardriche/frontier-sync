import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const { action } = await req.json();

    // Get driver profile
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: driverProfile } = await serviceClient
      .from("driver_profiles")
      .select("stripe_account_id, stripe_onboarding_complete, full_name")
      .eq("user_id", user.id)
      .single();

    if (!driverProfile) {
      return new Response(JSON.stringify({ error: "Driver profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_account") {
      let accountId = driverProfile.stripe_account_id;

      if (!accountId) {
        // Create a new Stripe Connect Express account
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email,
          capabilities: {
            transfers: { requested: true },
          },
          business_type: "individual",
          individual: {
            first_name: driverProfile.full_name?.split(" ")[0] || "",
            last_name: driverProfile.full_name?.split(" ").slice(1).join(" ") || "",
            email: user.email,
          },
        });
        accountId = account.id;

        await serviceClient
          .from("driver_profiles")
          .update({ stripe_account_id: accountId })
          .eq("user_id", user.id);
      }

      // Create an account link for onboarding
      const origin = req.headers.get("origin") || "https://frontier-sync.lovable.app";
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/driver/profile`,
        return_url: `${origin}/dashboard/driver/profile?stripe_onboarding=complete`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      if (!driverProfile.stripe_account_id) {
        return new Response(
          JSON.stringify({ status: "not_connected", details_submitted: false, payouts_enabled: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const account = await stripe.accounts.retrieve(driverProfile.stripe_account_id);

      // Update onboarding status
      if (account.details_submitted && !driverProfile.stripe_onboarding_complete) {
        await serviceClient
          .from("driver_profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          status: "connected",
          details_submitted: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
          charges_enabled: account.charges_enabled,
          external_accounts: account.external_accounts?.data?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_dashboard_link") {
      if (!driverProfile.stripe_account_id) {
        return new Response(JSON.stringify({ error: "No Stripe account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const loginLink = await stripe.accounts.createLoginLink(driverProfile.stripe_account_id);

      return new Response(JSON.stringify({ url: loginLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
