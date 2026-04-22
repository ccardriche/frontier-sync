// Edge function: import-loads
// Sources: trulos (scrape), ffs (scrape), text (AI parse), csv (AI assist optional)
// CORS + JWT validation in code.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  raw?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ----- Source: Trulos (free public listings) -----
async function scrapeTrulos(params: { origin?: string; destination?: string }): Promise<NormalizedLoad[]> {
  // Trulos exposes city-pair pages like https://www.trulos.com/load-board/<state>/
  // We do a generic search page fetch + simple regex scrape. Selectors break easily; fail soft.
  const q = encodeURIComponent(`${params.origin ?? ""} ${params.destination ?? ""}`.trim());
  const url = `https://www.trulos.com/load-board/?search=${q}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ANCHOR-LoadImporter/1.0; +https://frontier-sync.lovable.app)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extremely defensive parsing — Trulos has no stable selectors. Look for tabular rows.
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
    const loads: NormalizedLoad[] = [];
    for (const row of rows.slice(0, 30)) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
        m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
      );
      if (cells.length < 4) continue;
      const [origin, dest, equipment, weight, rate] = [cells[0], cells[1], cells[2], cells[3], cells[4]];
      if (!origin || !dest || origin.length > 80 || dest.length > 80) continue;
      loads.push({
        pickup_label: origin,
        drop_label: dest,
        equipment: equipment || null,
        weight_lbs: weight ? Number(weight.replace(/[^\d]/g, "")) || null : null,
        rate_usd: rate ? Number(rate.replace(/[^\d.]/g, "")) || null : null,
        external_ref: null,
        raw: row.slice(0, 500),
      });
    }
    return loads;
  } catch (e) {
    console.error("trulos scrape failed", e);
    return [];
  }
}

// ----- Source: FreeFreightSearch -----
async function scrapeFFS(params: { origin?: string; destination?: string }): Promise<NormalizedLoad[]> {
  // FFS does not offer an open search; return empty + let UI fall back.
  // Stub left for future integration.
  console.log("FFS scrape requested for", params);
  return [];
}

// ----- AI parse for raw text / CSV rows -----
async function aiParseText(rawText: string): Promise<NormalizedLoad[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract freight loads from broker emails or load board exports. Return only the loads you are confident about. Cities should be 'City, ST' format when possible.",
        },
        { role: "user", content: rawText.slice(0, 12000) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_loads",
            description: "Extract freight loads from text",
            parameters: {
              type: "object",
              properties: {
                loads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pickup_label: { type: "string" },
                      drop_label: { type: "string" },
                      pickup_date: { type: "string", description: "ISO date if known" },
                      dropoff_date: { type: "string", description: "ISO date if known" },
                      weight_lbs: { type: "number" },
                      rate_usd: { type: "number" },
                      equipment: { type: "string" },
                      contact: { type: "string" },
                      external_ref: { type: "string" },
                    },
                    required: ["pickup_label", "drop_label"],
                  },
                },
              },
              required: ["loads"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_loads" } },
    }),
  });

  if (resp.status === 429) throw new Response("Rate limited", { status: 429 });
  if (resp.status === 402) throw new Response("Credits exhausted", { status: 402 });
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    throw new Error("AI parse failed");
  }

  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return [];
  try {
    const parsed = JSON.parse(call.function.arguments);
    return (parsed.loads ?? []) as NormalizedLoad[];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const source: string = body.source ?? "text";
    const params = body.params ?? {};

    let loads: NormalizedLoad[] = [];
    try {
      if (source === "trulos") loads = await scrapeTrulos(params);
      else if (source === "ffs") loads = await scrapeFFS(params);
      else if (source === "text" || source === "csv") loads = await aiParseText(params.text ?? "");
      else return json({ error: `Unknown source: ${source}` }, 400);
    } catch (e) {
      if (e instanceof Response) {
        const status = e.status;
        const msg =
          status === 429
            ? "Rate limit reached. Please wait a moment and try again."
            : status === 402
              ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
              : "Import failed.";
        return json({ error: msg }, status);
      }
      throw e;
    }

    // Audit row
    await supabase.from("load_imports").insert({
      shipper_id: userData.user.id,
      source,
      raw_payload: { params, count: loads.length },
      jobs_created: 0,
    });

    return json({ source, loads });
  } catch (e) {
    console.error("import-loads error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
