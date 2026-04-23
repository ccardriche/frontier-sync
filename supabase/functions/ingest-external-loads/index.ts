// Ingests external loads from configured load_sources (JSON, CSV, RSS).
// Admin-only invocation. Records every run in sync_logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormalizedLoad {
  external_load_id: string;
  title?: string | null;
  origin_city?: string | null;
  origin_state?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  pickup_date?: string | null;
  delivery_date?: string | null;
  equipment_type?: string | null;
  weight_lbs?: number | null;
  miles?: number | null;
  rate_cents?: number | null;
  broker_name?: string | null;
  broker_phone?: string | null;
  broker_email?: string | null;
  external_url?: string | null;
  raw_payload?: unknown;
}

function csvToRows(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function parseRss(text: string): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const block = m[1];
    const get = (tag: string) => {
      const tm = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
      return tm ? tm[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    };
    items.push({ guid: get("guid"), title: get("title"), description: get("description"), link: get("link") });
  }
  return items;
}

function normalize(raw: Record<string, unknown>, mapping: Record<string, string>): NormalizedLoad | null {
  const m = mapping ?? {};
  const get = (key: string): string | undefined => {
    const src = m[key] ?? key;
    const v = raw[src];
    return v == null ? undefined : String(v);
  };
  const ext = get("external_load_id") ?? get("id") ?? get("guid") ?? get("load_id");
  if (!ext) return null;
  const num = (s: string | undefined) => (s ? Number(s.toString().replace(/[^0-9.]/g, "")) : null);
  const rate = num(get("rate") ?? get("rate_usd") ?? get("price"));
  return {
    external_load_id: String(ext),
    title: get("title") ?? null,
    origin_city: get("origin_city") ?? null,
    origin_state: get("origin_state") ?? null,
    destination_city: get("destination_city") ?? get("dest_city") ?? null,
    destination_state: get("destination_state") ?? get("dest_state") ?? null,
    pickup_date: get("pickup_date") ?? null,
    delivery_date: get("delivery_date") ?? null,
    equipment_type: get("equipment_type") ?? get("equipment") ?? null,
    weight_lbs: num(get("weight_lbs") ?? get("weight")),
    miles: num(get("miles")),
    rate_cents: rate ? Math.round(rate * 100) : null,
    broker_name: get("broker_name") ?? null,
    broker_phone: get("broker_phone") ?? null,
    broker_email: get("broker_email") ?? null,
    external_url: get("external_url") ?? get("link") ?? get("url") ?? null,
    raw_payload: raw,
  };
}

async function fetchAndParse(source: {
  source_type: string;
  feed_url: string | null;
  auth_type: string;
  api_key: string | null;
  field_mapping_json: Record<string, string> | null;
}): Promise<NormalizedLoad[]> {
  if (!source.feed_url) return [];
  const headers: Record<string, string> = {};
  if (source.auth_type === "api_key" && source.api_key) headers["X-API-Key"] = source.api_key;
  if (source.auth_type === "bearer" && source.api_key) headers["Authorization"] = `Bearer ${source.api_key}`;
  const res = await fetch(source.feed_url, { headers });
  if (!res.ok) throw new Error(`Source HTTP ${res.status}`);
  const text = await res.text();
  const mapping = source.field_mapping_json ?? {};
  let rows: Array<Record<string, unknown>> = [];
  if (source.source_type === "json" || source.source_type === "api") {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : (parsed.loads ?? parsed.data ?? []);
  } else if (source.source_type === "csv") {
    rows = csvToRows(text);
  } else if (source.source_type === "rss") {
    rows = parseRss(text);
  }
  return rows.map((r) => normalize(r, mapping)).filter((x): x is NormalizedLoad => x !== null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";

  // Verify caller is admin
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: roleRow } = await userClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const sourceId: string | undefined = body.source_id;
  const isTest: boolean = body.test === true;

  let query = admin.from("load_sources").select("*").eq("is_active", true);
  if (sourceId) query = admin.from("load_sources").select("*").eq("id", sourceId);
  const { data: sources, error: sErr } = await query;
  if (sErr) return new Response(JSON.stringify({ error: sErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let totalAdded = 0, totalUpdated = 0;
  const results: Array<Record<string, unknown>> = [];

  for (const src of sources ?? []) {
    try {
      const loads = await fetchAndParse(src);
      if (isTest) {
        results.push({ source: src.source_name, ok: true, fetched: loads.length });
        continue;
      }
      let added = 0, updated = 0;
      for (const l of loads) {
        const { data: existing } = await admin.from("external_loads")
          .select("id").eq("source_name", src.source_name).eq("external_load_id", l.external_load_id).maybeSingle();
        const row = { ...l, source_name: src.source_name, source_type: src.source_type, last_synced_at: new Date().toISOString(), status: "active" };
        if (existing) {
          await admin.from("external_loads").update(row).eq("id", existing.id);
          updated++;
        } else {
          await admin.from("external_loads").insert(row);
          added++;
        }
      }
      totalAdded += added; totalUpdated += updated;
      await admin.from("sync_logs").insert({ source_id: src.id, sync_status: "success", records_added: added, records_updated: updated });
      await admin.from("load_sources").update({ last_synced_at: new Date().toISOString() }).eq("id", src.id);
      results.push({ source: src.source_name, ok: true, added, updated });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("sync_logs").insert({ source_id: src.id, sync_status: "failed", error_message: msg });
      results.push({ source: src.source_name, ok: false, error: msg });
    }
  }

  return new Response(JSON.stringify({ ok: true, message: isTest ? "Test complete" : "Sync complete", records_added: totalAdded, records_updated: totalUpdated, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
