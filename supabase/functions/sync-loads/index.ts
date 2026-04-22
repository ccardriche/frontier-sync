// Scheduled background sync: pulls loads from external boards into jobs table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MARKETPLACE_SHIPPER_EMAIL = "marketplace@anchor.system";

interface NormalizedLoad {
  external_ref?: string | null;
  pickup_label: string;
  drop_label: string;
  pickup_date?: string | null;
  dropoff_date?: string | null;
  weight_lbs?: number | null;
  rate_usd?: number | null;
  equipment?: string | null;
  contact?: string | null;
}

async function geocode(label: string): Promise<{ lat: number; lng: number } | null> {
  if (!label || label.length < 3) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(label)}`,
      { headers: { "Accept-Language": "en", "User-Agent": "ANCHOR-Sync/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function scrapeTrulos(params: {
  origin_label?: string | null;
  dest_label?: string | null;
}): Promise<NormalizedLoad[]> {
  try {
    const url = `https://www.trulos.com/load-board.aspx?o=${encodeURIComponent(
      params.origin_label ?? "",
    )}&d=${encodeURIComponent(params.dest_label ?? "")}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 ANCHOR-Sync/1.0" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    const loads: NormalizedLoad[] = [];
    for (const r of rows) {
      const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
        c[1].replace(/<[^>]+>/g, "").trim(),
      );
      if (cells.length < 4) continue;
      loads.push({
        external_ref: `trulos-${cells.join("|").slice(0, 80)}`,
        pickup_label: cells[0],
        drop_label: cells[1],
        equipment: cells[2] ?? null,
        rate_usd: cells[3] ? parseFloat(cells[3].replace(/[^0-9.]/g, "")) || null : null,
      });
    }
    return loads;
  } catch {
    return [];
  }
}

async function ensureMarketplaceShipper(admin: ReturnType<typeof createClient>): Promise<string> {
  // Check existing
  const { data: existing } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "shipper")
    .limit(1000);
  // Look for a profile named ANCHOR Marketplace
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("full_name", "ANCHOR Marketplace")
    .maybeSingle();
  if (profile?.id) return profile.id as string;

  // Create auth user via admin API
  const { data: created, error: createErr } = await (admin as any).auth.admin.createUser({
    email: MARKETPLACE_SHIPPER_EMAIL,
    password: crypto.randomUUID() + "Aa1!",
    email_confirm: true,
    user_metadata: { full_name: "ANCHOR Marketplace" },
  });
  if (createErr || !created?.user) {
    throw new Error(`Failed to provision marketplace shipper: ${createErr?.message}`);
  }
  const uid = created.user.id;
  // Profile is auto-created by handle_new_user trigger. Update name.
  await admin.from("profiles").update({ full_name: "ANCHOR Marketplace", verified: true }).eq("id", uid);
  await admin.from("user_roles").insert({ user_id: uid, role: "shipper" });
  return uid;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Optional: support a single watchId for "Run now"
    let watchIdFilter: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.watch_id) watchIdFilter = String(body.watch_id);
      } catch {
        // empty body fine
      }
    }

    const shipperId = await ensureMarketplaceShipper(admin);

    let q = admin.from("lane_watches").select("*").eq("is_active", true);
    if (watchIdFilter) q = q.eq("id", watchIdFilter);
    const { data: watches, error: wErr } = await q;
    if (wErr) throw wErr;

    let totalImported = 0;
    const results: Array<{ id: string; imported: number; status: string }> = [];

    for (const w of watches ?? []) {
      let imported = 0;
      let status = "ok";
      try {
        const allLoads: NormalizedLoad[] = [];
        for (const src of w.sources ?? []) {
          if (src === "trulos") {
            const loads = await scrapeTrulos({
              origin_label: w.origin_label,
              dest_label: w.dest_label,
            });
            allLoads.push(...loads.map((l) => ({ ...l, external_ref: l.external_ref })));
          }
          // ffs / dat / 123lb stubs — Phase 2
        }

        for (const load of allLoads) {
          if (w.min_rate_cents && load.rate_usd) {
            if (Math.round(load.rate_usd * 100) < w.min_rate_cents) continue;
          }
          const [pickup, drop] = await Promise.all([
            geocode(load.pickup_label),
            geocode(load.drop_label),
          ]);
          const distance = pickup && drop ? haversineKm(pickup, drop) : null;
          const rateCents = load.rate_usd ? Math.round(load.rate_usd * 100) : null;
          const weightKg = load.weight_lbs ? Math.round(load.weight_lbs * 0.453592) : null;
          const externalRef = load.external_ref ?? `${w.sources[0]}-${load.pickup_label}-${load.drop_label}`;

          const { error: insErr } = await admin.from("jobs").upsert(
            {
              shipper_id: shipperId,
              title: `${load.pickup_label} → ${load.drop_label}`,
              pickup_label: load.pickup_label,
              pickup_lat: pickup?.lat ?? null,
              pickup_lng: pickup?.lng ?? null,
              drop_label: load.drop_label,
              drop_lat: drop?.lat ?? null,
              drop_lng: drop?.lng ?? null,
              weight_kg: weightKg,
              budget_cents: rateCents,
              pricing_type: "bid",
              min_budget_cents: rateCents ? Math.round(rateCents * 0.8) : null,
              max_budget_cents: rateCents,
              distance_km: distance,
              scheduled_pickup: load.pickup_date ?? null,
              scheduled_dropoff: load.dropoff_date ?? null,
              status: "posted",
              source: w.sources[0] ?? "trulos",
              external_ref: externalRef,
              imported_at: new Date().toISOString(),
            },
            { onConflict: "source,external_ref", ignoreDuplicates: true },
          );
          if (!insErr) imported++;
          await new Promise((r) => setTimeout(r, 1100)); // be polite to Nominatim
        }

        if (allLoads.length === 0) status = "no_results";
      } catch (e) {
        status = `error: ${(e as Error).message.slice(0, 200)}`;
      }

      await admin
        .from("lane_watches")
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: status,
          last_run_imported: imported,
          total_imported: (w.total_imported ?? 0) + imported,
        })
        .eq("id", w.id);

      await admin.from("load_imports").insert({
        shipper_id: shipperId,
        source: w.sources[0] ?? "trulos",
        jobs_created: imported,
        raw_payload: { watch_id: w.id, status },
      });

      totalImported += imported;
      results.push({ id: w.id, imported, status });
    }

    return new Response(JSON.stringify({ ok: true, totalImported, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
