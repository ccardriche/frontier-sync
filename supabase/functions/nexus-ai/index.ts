import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, userRole } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to query database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather context from database
    let contextData: any = {
      activeJobs: [],
      recentGpsLogs: [],
      availableHubs: [],
      stats: {}
    };

    try {
      // Get active jobs with bids count
      const { data: jobs } = await supabase
        .from("jobs")
        .select(`
          id, title, status, urgency, pickup_label, drop_label, budget_cents, created_at,
          shipper_id,
          bids:bids(count)
        `)
        .in("status", ["posted", "bidding", "assigned", "enroute_pickup", "picked_up", "in_transit"])
        .order("created_at", { ascending: false })
        .limit(10);
      
      contextData.activeJobs = jobs || [];

      // Get recent GPS logs for tracking
      const { data: gpsLogs } = await supabase
        .from("gps_logs")
        .select("job_id, lat, lng, speed_kph, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      
      contextData.recentGpsLogs = gpsLogs || [];

      // Get active hubs
      const { data: hubs } = await supabase
        .from("hub_listings")
        .select("id, hub_name, hub_type, location_label, is_active, fee_cents")
        .eq("is_active", true)
        .eq("verification_status", "approved")
        .limit(10);
      
      contextData.availableHubs = hubs || [];

      // Get platform stats
      const { count: totalJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });
      
      const { count: inTransitJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_transit");
      
      const { count: deliveredJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered");

      const { count: totalDrivers } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "driver");

      const { count: totalHubs } = await supabase
        .from("hub_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      contextData.stats = {
        totalJobs: totalJobs || 0,
        inTransitJobs: inTransitJobs || 0,
        deliveredJobs: deliveredJobs || 0,
        totalDrivers: totalDrivers || 0,
        totalHubs: totalHubs || 0,
        deliveryRate: totalJobs && totalJobs > 0 
          ? ((deliveredJobs || 0) / totalJobs * 100).toFixed(1) + "%"
          : "N/A"
      };

    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Continue with empty context if DB fails
    }

    // Build system prompt with real data context
    const systemPrompt = `You are Nexus AI, the intelligent dispatch assistant for Pioneer Nexus - a multi-sided logistics marketplace connecting shippers, drivers, and landowners.

You have access to real-time platform data:

## Current Platform Statistics
- Total Jobs: ${contextData.stats.totalJobs}
- Jobs In Transit: ${contextData.stats.inTransitJobs}
- Delivered Jobs: ${contextData.stats.deliveredJobs}
- Registered Drivers: ${contextData.stats.totalDrivers}
- Active Hubs: ${contextData.stats.totalHubs}
- Overall Delivery Rate: ${contextData.stats.deliveryRate}

## Active Jobs (${contextData.activeJobs.length} shown)
${contextData.activeJobs.length > 0 
  ? contextData.activeJobs.map((job: any) => 
      `- ${job.title} | Status: ${job.status} | Route: ${job.pickup_label || 'N/A'} → ${job.drop_label || 'N/A'} | Urgency: ${job.urgency ? 'HIGH' : 'Normal'} | Budget: $${(job.budget_cents || 0) / 100}`
    ).join('\n')
  : 'No active jobs currently'}

## Recent GPS Activity (${contextData.recentGpsLogs.length} pings)
${contextData.recentGpsLogs.length > 0
  ? 'Latest tracking data available for active deliveries'
  : 'No recent GPS activity'}

## Available Hubs (${contextData.availableHubs.length} active)
${contextData.availableHubs.length > 0
  ? contextData.availableHubs.map((hub: any) =>
      `- ${hub.hub_name} (${hub.hub_type}) at ${hub.location_label || 'Location TBD'}`
    ).join('\n')
  : 'No approved hubs available'}

## Your Capabilities
1. **Cargo Tracking**: Answer "Where is my cargo?" with real GPS data and ETA estimates
2. **Job Status**: Provide current status of any shipment in the system
3. **Driver Dispatch**: Recommend optimal driver assignments based on proximity and ratings
4. **Hub Management**: Help landowners understand hub usage and earnings
5. **Route Optimization**: Suggest efficient routes considering road conditions
6. **Issue Resolution**: Help resolve disputes and create support tickets when needed
7. **Platform Stats**: Provide real-time analytics on platform performance

## User Context
${userId ? `User ID: ${userId}` : 'Guest user'}
${userRole ? `User Role: ${userRole}` : 'Role not specified'}

## Guidelines
- Be concise and professional
- Provide specific, actionable information when possible
- If you cannot find data for a specific query, offer to create a support ticket
- Always reference real data from the context above when available
- For tracking queries, provide location and ETA estimates
- Learn from interactions to improve future responses

Remember: You are the agentic brain of Pioneer Nexus. Help users efficiently manage their logistics operations.`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: assistantMessage,
        context: {
          jobsQueried: contextData.activeJobs.length,
          hubsAvailable: contextData.availableHubs.length,
          stats: contextData.stats
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Nexus AI error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process request" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
