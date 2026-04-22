

## Plan: Fix "No loads found" on Trulos import

### Problem
Trulos doesn't have a real public search endpoint we can scrape — the regex parser returns 0 rows for almost any query (including Atlanta→Dallas), so the dialog feels broken. The user got the generic "No loads found" toast and read it as an error.

### Fix — three changes

**1. Replace the broken Trulos scraper with a working free source: 123Loadboard's public RSS-style feed**
- Trulos blocks scrapers; replacing it with `scrapeTrulos` calls that always return `[]` is misleading.
- Use the **public DAT free posting feed** + **uShip open marketplace** (both have JSON endpoints that don't require auth for browsing). Where neither returns rows, fall back to a clear "this source has nothing matching — try Paste Text" message instead of a silent empty list.

**2. Improve the empty-state UX in `ImportLoadsDialog`**
- When `loads.length === 0` after a search, show an inline panel (not just a toast) that says:
  > "No public listings matched Atlanta → Dallas right now. Free load boards rarely expose live data without an account. Try **Paste Text** with a broker email, or upload a **CSV** export."
- Add a one-click "Try Paste Text instead" button that switches tabs and pre-fills `Atlanta, GA → Dallas, TX` so the AI parser has context.

**3. Make the edge function distinguish "source unavailable" vs "search returned nothing"**
- Edge function returns `{ loads: [], reason: "source_unavailable" | "no_matches" }`.
- Hook surfaces the reason in the toast so the user knows scraping is the limitation, not their query.

### Files changed

- `supabase/functions/import-loads/index.ts` — drop the dead `scrapeTrulos` regex; add a real call to a working public endpoint; return `{ loads, reason }`.
- `src/hooks/useLoadImport.ts` — read `reason` from response and pass it through.
- `src/components/shipper/ImportLoadsDialog.tsx` — add empty-state panel with "Switch to Paste Text" button, accept `lastSearchReason` from the hook.

### What this does NOT do

- Does **not** add real DAT/123LB/Truckstop API integration — those still require paid credentials (Phase 2 of the original plan).
- Does **not** guarantee the load board tab returns Atlanta→Dallas results — public scraping is inherently unreliable. The honest fix is to tell the user that and route them to the paths that do work (Paste Text via Lovable AI, CSV upload).

### Recommended next action for the user
After this ships, paste a sample broker email like:
```
ATL → DAL, 45,000 lbs dry van, $2,400, pickup 4/23, contact Mike 555-1234
```
into the **Paste Text** tab. That path uses Gemini and works reliably.

