

## Plan: Import Loads from External Load Boards (Shipper Side)

### Goal
Let shippers pull existing freight postings from public/free load boards (123Loadboard, DAT free feeds, Trulos, etc.) into ANCHOR as draft jobs they can review, edit, and post — instead of typing every load by hand.

---

### Reality check on "free" load boards

Most major US load boards are **not openly accessible**:

| Source | Access | Use in Phase 1? |
|---|---|---|
| **123Loadboard** | Paid subscription + partner API (no public free API) | No — requires user account + API key |
| **DAT One** | Paid + OAuth API for subscribers | No — phase 2 (BYO credentials) |
| **Truckstop.com** | Paid + REST API for subscribers | No — phase 2 |
| **Trulos** | Public free listings on website | Yes — scrape |
| **FreeFreightSearch** | Public free listings | Yes — scrape |
| **DOT/FMCSA SAFER** | Public, free | Carrier verification only |
| **CSV / Email forwards** | Universal | Yes — manual import |

So the plan is **3 phases**, starting with what's actually free.

---

### Phase 1 — Free sources (scrape + CSV import)

**1. New "Import Loads" button** on the Shipper Dashboard, next to "Post New Job", opens a dialog with three tabs:
- **From Load Board** — pick a free source (Trulos, FreeFreightSearch), enter origin/destination/radius, click Search
- **From CSV** — upload a CSV/XLSX exported from any load board, map columns to ANCHOR fields
- **From Email/Text** — paste raw load text (broker email blast); AI parses it into structured fields

**2. New edge function `import-loads`** (Deno):
- Accepts `{ source: "trulos" | "ffs" | "csv" | "text", params }`
- For scrape sources: server-side `fetch` of the public results page → parse HTML with a lightweight DOM library → return normalized loads
- For text/CSV: forwards to Lovable AI Gateway (`google/gemini-2.5-flash`) with a strict JSON schema to extract `{ pickup, drop, weight, rate, pickup_date, equipment, contact }`
- Rate-limited per-shipper (10 imports / min) to stay polite to source sites

**3. Import review screen**:
- Shows imported loads as a table with checkboxes
- Each row is editable inline (rate, dates, notes)
- "Geocode + Import Selected" → for each row: Nominatim lookup of pickup/drop → distance via existing `calculateDistance()` → insert as `jobs` row with `status='posted'`, `pricing_type='bid'` defaults, and a new `source` field tagging origin

**4. Database migration**:
```sql
ALTER TABLE public.jobs
  ADD COLUMN source text DEFAULT 'manual',          -- 'manual' | 'trulos' | 'ffs' | 'csv' | 'text' | 'dat' | '123lb'
  ADD COLUMN external_ref text,                     -- original load ID from source
  ADD COLUMN imported_at timestamptz;

CREATE TABLE public.load_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id uuid NOT NULL,
  source text NOT NULL,
  raw_payload jsonb NOT NULL,
  jobs_created int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.load_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shippers see own imports" ON public.load_imports
  FOR SELECT USING (auth.uid() = shipper_id);
CREATE POLICY "Shippers create own imports" ON public.load_imports
  FOR INSERT WITH CHECK (auth.uid() = shipper_id);
```

---

### Phase 2 — Bring-Your-Own-Credentials (paid boards)

For shippers who already pay for DAT / 123Loadboard / Truckstop:

- New **Settings → Load Board Connections** page
- Per-shipper encrypted storage of API keys/OAuth tokens in a `load_board_connections` table (RLS, row-encrypted via pgsodium or stored as Supabase secret per user)
- Edge function adapters: `dat-adapter`, `123lb-adapter`, `truckstop-adapter` — each implements the same `searchLoads(params)` interface used by Phase 1
- Same import review UI — just more sources in the dropdown

---

### Phase 3 — Scheduled auto-import

- Shippers save a "Lane Watch" (origin radius → destination radius, equipment, min rate)
- pg_cron job runs every 30 min, calls `import-loads` per saved watch, drops new matches into a "Pending Review" queue with toast notification

---

### UX flow

```text
Shipper Dashboard
   └── [Import Loads] button
        └── Import Dialog
             ├── Tab: Load Board   → form (origin, dest, radius, equipment) → Search
             ├── Tab: CSV Upload   → drop file → column mapping
             └── Tab: Paste Text   → textarea → AI extract
                  ↓
            Review Table (editable rows, checkboxes)
                  ↓
            [Import N Selected] → geocode → insert jobs (status=posted)
                  ↓
            Toast "Imported 7 loads" → dashboard refreshes
```

---

### Files to add / change

**New:**
- `supabase/migrations/<ts>_load_imports.sql`
- `supabase/functions/import-loads/index.ts` (scrape + AI parse)
- `src/components/shipper/ImportLoadsDialog.tsx`
- `src/components/shipper/ImportReviewTable.tsx`
- `src/hooks/useLoadImport.ts`
- `src/lib/loadboardAdapters/trulos.ts`, `freeFreightSearch.ts`, `csvParser.ts`

**Edit:**
- `src/pages/ShipperDashboard.tsx` — add "Import Loads" button next to "Post New Job"
- `src/integrations/supabase/types.ts` — auto-regenerated after migration
- `src/components/shipper/JobCard.tsx` — show small "Imported from Trulos" badge when `source !== 'manual'`

---

### Legal & technical notes

- Scraping public HTML pages is permitted but fragile — selectors break when sites redesign. We add a parser version field and graceful "couldn't parse, paste text instead" fallback.
- Respect each source's `robots.txt` and add a 2 s delay between requests in the edge function.
- Never store credentials for paid boards in client code — Phase 2 uses Supabase secrets per shipper.
- Lovable AI is used for the "paste text" path (no extra API key needed).

---

### What you decide before we build

1. **Start with Phase 1 only?** (Trulos scrape + CSV + AI text paste) — recommended, ships in one pass.
2. **Which free sources first?** Trulos + FreeFreightSearch are the realistic pair.
3. **Phase 2 boards priority?** DAT, 123Loadboard, or Truckstop first when we get there.

