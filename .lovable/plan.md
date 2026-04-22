

## Plan: Auto-pull loads from external boards → live driver feed

### Goal
Replace the manual "Import Loads" review-and-post flow with a **scheduled background sync** that pulls from external sources every N minutes and publishes matching loads directly to the driver's "Available Jobs" feed — no shipper touch required.

### How it works

```text
┌──────────────────────────────┐
│ pg_cron (every 15 min)       │
│  → calls sync-loads function │
└────────────┬─────────────────┘
             ↓
┌──────────────────────────────┐
│ sync-loads edge function     │
│  • For each active LaneWatch │
│  • Scrape Trulos + FFS       │
│  • (Phase 2) DAT/123LB API   │
│  • Dedupe by external_ref    │
│  • Insert as jobs (status=   │
│    'posted', source=...)     │
└────────────┬─────────────────┘
             ↓
┌──────────────────────────────┐
│ jobs table (RLS: public read)│
└────────────┬─────────────────┘
             ↓
┌──────────────────────────────┐
│ Driver Dashboard             │
│  → useAvailableJobs() picks  │
│    them up via realtime      │
└──────────────────────────────┘
```

### Database changes

1. **New `lane_watches` table** — shipper- or admin-owned saved searches that drive the scheduler.
   ```
   id, owner_id, source[] (trulos|ffs|dat|123lb),
   origin_label, origin_radius_km, dest_label, dest_radius_km,
   equipment, min_rate_cents, is_active, last_run_at, total_imported
   ```
   RLS: owner read/write own; admins read all.

2. **Unique index on `jobs(source, external_ref)`** — prevents duplicate inserts when the cron re-pulls the same listing.

3. **New `system_shipper_id`** — a service-role-owned shipper account ("ANCHOR Marketplace") used as `shipper_id` on auto-imported jobs so RLS stays clean. Created via migration.

4. **Enable `pg_cron` + `pg_net`** extensions (if not already on).

### Edge function: `sync-loads`

- Scheduled by `pg_cron` every 15 min.
- Loads all `is_active = true` lane watches.
- For each watch, calls each enabled source adapter:
  - **trulos** — existing scraper (best-effort).
  - **ffs** — stub for now, returns [].
  - **dat / 123lb** — Phase 2 (BYO credentials).
- Geocodes pickup/drop via Nominatim, computes distance.
- Upserts into `jobs` with:
  - `status = 'posted'`, `pricing_type = 'bid'`
  - `shipper_id = system_shipper_id`
  - `source`, `external_ref`, `imported_at`
  - `min_budget_cents` derived from rate (or null)
- Updates `lane_watches.last_run_at` + `total_imported`.
- Inserts a `load_imports` audit row per run.

### UI changes

**Shipper dashboard** — replace the "Import Loads" dialog with a **"Lane Watches"** management panel:
- List of active watches (origin → dest, sources, last run, imports today).
- Add/edit/pause/delete watches.
- Manual "Run now" button per watch.
- Existing `ImportLoadsDialog` → repurposed as a one-off / preview tool inside the watch editor.

**Driver dashboard** — no UI changes required. Auto-imported jobs already flow into `useAvailableJobs()` because they share the `jobs` table. Optional: small "From load board" badge on cards where `source !== 'manual'` (already added in earlier phase).

### Files to add / change

**New**
- `supabase/migrations/<ts>_lane_watches_and_cron.sql` — table, unique index, system shipper seed, pg_cron job
- `supabase/functions/sync-loads/index.ts` — scheduled sync entry point
- `src/components/shipper/LaneWatchesPanel.tsx`
- `src/components/shipper/LaneWatchForm.tsx`
- `src/hooks/useLaneWatches.ts`

**Edit**
- `src/pages/ShipperDashboard.tsx` — swap "Import Loads" button for "Lane Watches" panel
- `src/components/shipper/JobCard.tsx` — already shows source badge, no change
- `supabase/functions/import-loads/index.ts` — keep for ad-hoc/manual paste; reused by watch "Run now"

### Honesty notes

- **Free scrapers stay unreliable.** Trulos returns near-zero results in practice. The pipeline is correct; the data quality is what it is until paid APIs (DAT/123LB) are wired in Phase 2.
- **Auto-publishing means jobs appear under a system "ANCHOR Marketplace" shipper**, not a real customer. Drivers bidding on these need a clear flow for who actually pays — out of scope for this step but worth flagging.
- **Cron interval = 15 min** to stay polite on public sites and avoid rate-limit issues. Adjustable.

### What we're NOT doing this round
- No paid DAT / 123Loadboard / Truckstop API integration (Phase 2).
- No automatic driver assignment — drivers still bid or accept fixed rates as today.
- No payment routing for marketplace-sourced loads.

### Recommended next step after this ships
Add **DAT One BYO-API-key** so a shipper with a real DAT subscription can plug in and the cron pulls live, high-quality loads instead of scraping.

